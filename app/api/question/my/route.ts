/* path: app/api/question/my/route.ts */
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { QuestionStatus } from '@prisma/client';

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

function getTgIdFromCookies(): string | null {
  const botToken = envClean('TELEGRAM_BOT_TOKEN');
  const initData = cookies().get('tg_init_data')?.value || '';
  if (!botToken || !initData) return null;
  return verifyAndExtractTelegramId(initData, botToken);
}

export async function GET() {
  try {
    const tgId = getTgIdFromCookies();
    if (!tgId) return NextResponse.json({ ok: false, error: 'Открой из Telegram.' }, { status: 401 });

    const rows = await prisma.question.findMany({
      where: { authorTelegramId: String(tgId) },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        speciality: true,
        createdAt: true,
        status: true,

        // ✅ цена — чтобы не было "Платно" на пустом месте
        isFree: true,
        priceRub: true,

        // ✅ закрытие (как было)
        close: { select: { id: true } },

        // ✅ СКОЛЬКО ОТВЕТОВ (только не удалённые)
        _count: {
          select: {
            answers: {
              where: { isDeleted: false },
            },
          },
        },
      },
      take: 300,
    });

    const items = rows.map((q: any) => {
      const isClosed =
        !!q.close || String(q.status) === String(QuestionStatus.DONE) || String(q.status) === 'DONE';

      const answersCount = Number(q?._count?.answers ?? 0);

      const isFree = q?.isFree === true;
      const priceRubRaw = q?.priceRub;
      const priceRub =
        typeof priceRubRaw === 'number' && Number.isFinite(priceRubRaw) ? Math.max(0, Math.round(priceRubRaw)) : 0;

      return {
        id: String(q.id),
        title: String(q.title || ''),
        speciality: String(q.speciality || ''),
        createdAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : new Date(q.createdAt).toISOString(),

        // ✅ то, что нужно странице/карточке
        isClosed,
        answersCount,

        // ✅ то, что нужно чтобы правильно рисовалась "Бесплатно/₽"
        isFree,
        priceRub,
      };
    });

    return NextResponse.json({ ok: true, items }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: 'FAILED_MY_QUESTIONS', hint: String(e?.message || 'See server logs') },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

export const POST = GET;
