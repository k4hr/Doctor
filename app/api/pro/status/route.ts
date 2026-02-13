/* path: app/api/pro/status/route.ts */
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

    const telegramId = getTelegramIdStrict(initData);

    const doctor = await prisma.doctor.findUnique({
      where: { telegramId },
      select: { id: true, proUntil: true },
    });

    if (!doctor) {
      return NextResponse.json({ ok: true, isDoctor: false, isPro: false, proUntil: null });
    }

    const now = new Date();
    const proUntil = doctor.proUntil ? new Date(doctor.proUntil) : null;
    const isPro = !!proUntil && proUntil.getTime() > now.getTime();

    return NextResponse.json({
      ok: true,
      isDoctor: true,
      isPro,
      proUntil: proUntil ? proUntil.toISOString() : null,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

export const POST = GET;
