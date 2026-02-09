/* path: app/api/question/close/route.ts */
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DoctorTxStatus, DoctorTxType, QuestionStatus } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function envClean(name: string) {
  return String(process.env[name] ?? '').replace(/[\r\n]/g, '').trim();
}

function timingSafeEqualHex(a: string, b: string) {
  try {
    const ab = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

function verifyAndExtractTelegramId(initData: string, botToken: string): string | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');

    const dcs = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dcs).digest('hex');

    if (!timingSafeEqualHex(computedHash, hash)) return null;

    const userStr = params.get('user');
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    if (!user?.id) return null;

    return String(user.id);
  } catch {
    return null;
  }
}

function uniqStr(arr: any[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of arr || []) {
    const s = String(x || '').trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const botToken = envClean('TELEGRAM_BOT_TOKEN');
    const initData = cookies().get('tg_init_data')?.value || '';
    const tgId = botToken && initData ? verifyAndExtractTelegramId(initData, botToken) : null;

    if (!tgId) return NextResponse.json({ ok: false, error: 'Открой из Telegram.' }, { status: 401 });

    const body = (await req.json().catch(() => null)) as any;
    const questionId = String(body?.questionId || '').trim();
    const selectedDoctorIds = uniqStr(Array.isArray(body?.selectedDoctorIds) ? body.selectedDoctorIds : []);

    if (!questionId) return NextResponse.json({ ok: false, error: 'Нет questionId' }, { status: 400 });
    if (selectedDoctorIds.length === 0)
      return NextResponse.json({ ok: false, error: 'Выбери минимум одного врача' }, { status: 400 });
    if (selectedDoctorIds.length > 3)
      return NextResponse.json({ ok: false, error: 'Максимум 3 врача' }, { status: 400 });

    const q = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        close: true,
        answers: { where: { isDeleted: false }, select: { doctorId: true } },
      },
    });

    if (!q) return NextResponse.json({ ok: false, error: 'Вопрос не найден.' }, { status: 404 });

    if (String(q.authorTelegramId) !== String(tgId)) {
      return NextResponse.json({ ok: false, error: 'Только автор может закрыть вопрос.' }, { status: 403 });
    }

    const answeredDoctorIds = uniqStr((q.answers || []).map((a: any) => a.doctorId));
    if (answeredDoctorIds.length === 0) {
      return NextResponse.json({ ok: false, error: 'Нельзя закрыть вопрос: пока нет ответов.' }, { status: 400 });
    }

    const answeredSet = new Set(answeredDoctorIds);
    for (const did of selectedDoctorIds) {
      if (!answeredSet.has(did)) {
        return NextResponse.json(
          { ok: false, error: 'Можно выбрать только врачей, которые отвечали на вопрос.' },
          { status: 400 }
        );
      }
    }

    // ✅ идемпотентность: если уже закрыто — просто отдаем, что есть
    if (q.close) {
      return NextResponse.json({
        ok: true,
        questionId: String(q.id),
        selectedDoctorIds: (q.close as any).selectedDoctorIds || [],
        totalRub: Number((q.close as any).totalRub || 0),
        perDoctorRub: Number((q.close as any).perDoctorRub || 0),
        status: String((q.close as any).status),
      });
    }

    const isFree = !!(q as any).isFree;
    const totalRub = isFree ? 0 : Math.max(0, Number((q as any).priceRub || 0));

    const n = selectedDoctorIds.length;
    const per = !isFree && n > 0 ? Math.floor(totalRub / n) : 0;
    const rem = !isFree && n > 0 ? totalRub - per * n : 0;

    await prisma.$transaction(async (tx) => {
      await tx.questionClose.create({
        data: {
          questionId: String(q.id),
          authorTelegramId: String(tgId),
          selectedDoctorIds,
          totalRub,
          perDoctorRub: per,
          status: isFree ? 'CREATED' : 'PAID',
        } as any,
      });

      await tx.question.update({
        where: { id: String(q.id) },
        data: { status: QuestionStatus.DONE },
      });

      if (isFree || totalRub <= 0) return;

      for (let i = 0; i < selectedDoctorIds.length; i++) {
        const doctorId = selectedDoctorIds[i];
        const amount = per + (i === 0 ? rem : 0);
        if (amount <= 0) continue;

        await tx.doctorWallet.upsert({
          where: { doctorId },
          create: { doctorId, balanceRub: amount, pendingRub: 0 },
          update: { balanceRub: { increment: amount } },
        });

        await tx.doctorTransaction.create({
          data: {
            doctorId,
            type: DoctorTxType.IN,
            status: DoctorTxStatus.SUCCESS,
            amountRub: amount,
            title: `Оплата за вопрос ${String(q.id)}`,
            meta: {
              kind: 'QUESTION_CLOSE',
              questionId: String(q.id),
              selectedCount: selectedDoctorIds.length,
              amountRub: amount,
              totalRub,
            },
          },
        });
      }
    });

    return NextResponse.json({
      ok: true,
      questionId: String(q.id),
      selectedDoctorIds,
      totalRub,
      perDoctorRub: per,
      status: isFree ? 'CREATED' : 'PAID',
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}
