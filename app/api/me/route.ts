import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyInitData,
  getInitDataFrom,
  extractTelegramId,
  extractTelegramUser,
} from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Поддержим оба нейминга, чтобы не словить “токен не там”
const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.BOT_TOKEN ||
  process.env.TG_BOT_TOKEN ||
  '';

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { ok: false, error: 'BOT_TOKEN_MISSING', hint: 'Set TELEGRAM_BOT_TOKEN (or BOT_TOKEN/TG_BOT_TOKEN)' },
        { status: 500 }
      );
    }

    const initData = await getInitDataFrom(req);
    if (!initData) {
      return NextResponse.json(
        {
          ok: false,
          error: 'NO_INIT_DATA',
          hint: 'Pass initData in JSON body {initData} or header x-telegram-init-data or ?initData=...',
        },
        { status: 401 }
      );
    }

    const ok = verifyInitData(initData, BOT_TOKEN);
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'BAD_INITDATA' }, { status: 401 });
    }

    const telegramId = extractTelegramId(initData);
    if (!telegramId) {
      return NextResponse.json({ ok: false, error: 'NO_TELEGRAM_ID' }, { status: 400 });
    }

    const user = extractTelegramUser(initData);

    // если анкета врача уже есть — удобно
    const doctor = await prisma.doctor.findUnique({
      where: { telegramId },
      select: { id: true, status: true },
    });

    return NextResponse.json({
      ok: true,
      user,
      doctor: doctor ? { id: doctor.id, status: doctor.status } : null,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: 'SERVER_ERROR', hint: e?.message || 'Unknown' },
      { status: 500 }
    );
  }
}

export const GET = POST;
