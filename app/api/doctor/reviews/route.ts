/* path: app/api/doctor/reviews/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyInitData, getInitDataFrom, getTelegramIdStrict } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN =
  process.env.BOT_TOKEN ||
  process.env.TG_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  '';

function norm(s: any) {
  return String(s ?? '').trim();
}

function safeInt(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n);
}

function calcAvg(sum: number, count: number) {
  if (!count || count <= 0) return 0;
  return sum / count;
}

function round1(x: number) {
  return Math.round(x * 10) / 10;
}

export async function GET(req: NextRequest) {
  try {
    const initData = await getInitDataFrom(req);

    if (!initData) {
      return NextResponse.json(
        { ok: false, error: 'NO_INIT_DATA', hint: 'Открой из Telegram WebApp (initData обязателен).' },
        { status: 401 }
      );
    }

    if (!BOT_TOKEN) {
      return NextResponse.json(
        { ok: false, error: 'BOT_TOKEN_MISSING', hint: 'Set BOT_TOKEN/TG_BOT_TOKEN/TELEGRAM_BOT_TOKEN in env' },
        { status: 500 }
      );
    }

    if (!verifyInitData(initData, BOT_TOKEN)) {
      return NextResponse.json({ ok: false, error: 'BAD_INITDATA' }, { status: 401 });
    }

    // кто делает запрос (любой валидный пользователь)
    getTelegramIdStrict(initData);

    const url = new URL(req.url);
    const doctorIdQ = norm(url.searchParams.get('doctorId'));
    const limitQ = safeInt(url.searchParams.get('limit'));
    const limit = limitQ > 0 ? Math.min(limitQ, 50) : 50;

    let doctorId = doctorIdQ;

    // если doctorId не передали — пробуем понять "моего" врача по telegramId
    if (!doctorId) {
      const telegramId = getTelegramIdStrict(initData);
      const me = await prisma.doctor.findUnique({
        where: { telegramId },
        select: { id: true },
      });
      doctorId = me?.id ? String(me.id) : '';
    }

    if (!doctorId) {
      return NextResponse.json({ ok: true, doctorId: null, rating: { value: 0, count: 0 }, items: [] });
    }

    // агрегаты для рейтинга (быстро)
    const docAgg = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { ratingSum: true, ratingCount: true },
    });

    const ratingSum = Number(docAgg?.ratingSum ?? 0);
    const ratingCount = Number(docAgg?.ratingCount ?? 0);
    const avg = round1(calcAvg(ratingSum, ratingCount));

    const reviews = await prisma.doctorReview.findMany({
      where: { doctorId },
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        createdAt: true,
        rating: true,
        text: true,
        isVerified: true,
      },
    });

    const items = reviews.map((r) => ({
      id: String(r.id),
      createdAt: r.createdAt.toISOString(),
      rating: Number(r.rating),
      text: r.text ? String(r.text) : null,
      isVerified: !!r.isVerified,
    }));

    return NextResponse.json({
      ok: true,
      doctorId,
      rating: { value: avg, count: ratingCount },
      items,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
