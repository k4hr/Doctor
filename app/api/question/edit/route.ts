/* path: app/api/question/edit/route.ts */
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

function getTgIdSmart(initDataFromBody?: string | null): string | null {
  const botToken = envClean('TELEGRAM_BOT_TOKEN');

  const initDataCookie = cookies().get('tg_init_data')?.value || '';
  const fromCookie = botToken && initDataCookie ? verifyAndExtractTelegramId(initDataCookie, botToken) : null;
  if (fromCookie) return fromCookie;

  const fromBody = String(initDataFromBody || '').trim();
  return botToken && fromBody ? verifyAndExtractTelegramId(fromBody, botToken) : null;
}

function cleanText(s: any) {
  return String(s ?? '').replace(/\r\n/g, '\n').trim();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({} as any))) as any;

    const tgId = getTgIdSmart(body?.initData);
    if (!tgId) return NextResponse.json({ ok: false, error: 'Открой из Telegram.' }, { status: 401 });

    const questionId = String(body?.questionId || '').trim();
    const speciality = cleanText(body?.speciality);
    const title = cleanText(body?.title);
    const text = cleanText(body?.body);

    if (!questionId) return NextResponse.json({ ok: false, error: 'Нет questionId' }, { status: 400 });
    if (!speciality) return NextResponse.json({ ok: false, error: 'Выберите раздел медицины.' }, { status: 400 });
    if (title.length < 6) return NextResponse.json({ ok: false, error: 'Заголовок слишком короткий (минимум 6).' }, { status: 400 });
    if (title.length > 140) return NextResponse.json({ ok: false, error: 'Заголовок слишком длинный (максимум 140).' }, { status: 400 });
    if (text.length < 50) return NextResponse.json({ ok: false, error: 'Текст вопроса слишком короткий (минимум 50).' }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const q = await tx.question.findUnique({
        where: { id: questionId },
        select: {
          id: true,
          authorTelegramId: true,
          editCount: true,
          close: { select: { id: true } },
        },
      });

      if (!q) return { ok: false as const, status: 404, error: 'Вопрос не найден.' };

      const isAuthor = String(q.authorTelegramId) === String(tgId);
      if (!isAuthor) return { ok: false as const, status: 403, error: 'Только автор может редактировать.' };

      if (q.close) return { ok: false as const, status: 400, error: 'Нельзя редактировать закрытый вопрос.' };

      const editUsed = Number(q.editCount || 0) > 0;
      if (editUsed) return { ok: false as const, status: 400, error: 'Редактирование уже использовано.' };

      // ✅ атомарно: обновляем только если editCount ещё 0
      const upd = await tx.question.updateMany({
        where: {
          id: questionId,
          authorTelegramId: String(tgId),
          editCount: 0,
        },
        data: {
          speciality,
          title,
          body: text,
          editCount: 1,
          editedAt: new Date(),
        },
      });

      if (upd.count !== 1) {
        return { ok: false as const, status: 400, error: 'Не удалось сохранить (возможно, редактирование уже использовано).' };
      }

      return { ok: true as const, status: 200 };
    });

    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: 'FAILED_EDIT', hint: String(e?.message || 'See server logs') },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

export const GET = POST;
