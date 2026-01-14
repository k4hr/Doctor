/* path: app/api/me/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TgUser = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.BOT_TOKEN ||
  process.env.TG_BOT_TOKEN ||
  '';

function verifyTelegramWebAppInitData(initData: string, botToken: string) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { ok: false as const, error: 'NO_HASH' as const };

    params.delete('hash');

    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    const a = Buffer.from(computedHash, 'utf8');
    const b = Buffer.from(hash, 'utf8');
    if (a.length !== b.length) return { ok: false as const, error: 'BAD_HASH' as const };
    if (!crypto.timingSafeEqual(a, b)) return { ok: false as const, error: 'BAD_HASH' as const };

    const userStr = params.get('user');
    if (!userStr) return { ok: false as const, error: 'NO_USER' as const };

    let userJson: any;
    try {
      userJson = JSON.parse(userStr);
    } catch {
      return { ok: false as const, error: 'BAD_USER_JSON' as const };
    }

    if (!userJson?.id) return { ok: false as const, error: 'NO_USER_ID' as const };

    const user: TgUser = {
      id: String(userJson.id),
      username: userJson.username ? String(userJson.username) : null,
      first_name: userJson.first_name ? String(userJson.first_name) : null,
      last_name: userJson.last_name ? String(userJson.last_name) : null,
    };

    return { ok: true as const, user };
  } catch {
    return { ok: false as const, error: 'BAD_INITDATA' as const };
  }
}

function fromUrlParams(req: NextRequest): string {
  const url = new URL(req.url);

  // Telegram иногда кидает так:
  // ?tgWebAppData=<urlencoded initData>
  const tgWebAppData = (url.searchParams.get('tgWebAppData') || '').trim();
  if (tgWebAppData) return tgWebAppData;

  // на всякий случай
  const initData = (url.searchParams.get('initData') || '').trim();
  if (initData) return initData;

  return '';
}

async function readInitData(req: NextRequest): Promise<string> {
  // 1) header
  const h = (req.headers.get('x-telegram-init-data') || '').trim();
  if (h) return h;

  // 2) URL params
  const q = fromUrlParams(req);
  if (q) return q;

  // 3) JSON body { initData }
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/json')) {
    const body = await req.json().catch(() => null);
    const b = (body?.initData ? String(body.initData) : '').trim();
    if (b) return b;
  }

  return '';
}

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json(
        {
          ok: false,
          error: 'NO_BOT_TOKEN',
          hint: 'Set TELEGRAM_BOT_TOKEN (or BOT_TOKEN/TG_BOT_TOKEN) in env',
        },
        { status: 500 }
      );
    }

    const initData = await readInitData(req);
    if (!initData) {
      return NextResponse.json(
        {
          ok: false,
          error: 'NO_INIT_DATA',
          hint: 'Open app via Telegram WebApp button/menu (BotFather preview often has no initData).',
        },
        { status: 401 }
      );
    }

    const v = verifyTelegramWebAppInitData(initData, BOT_TOKEN);
    if (!v.ok) {
      return NextResponse.json({ ok: false, error: v.error }, { status: 401 });
    }

    const telegramId = v.user.id;

    const doctor = await prisma.doctor.findUnique({
      where: { telegramId },
      select: { id: true, status: true },
    });

    return NextResponse.json({
      ok: true,
      user: v.user,
      doctor: doctor ? { id: doctor.id, status: doctor.status } : null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED_TO_LOAD' }, { status: 500 });
  }
}

export const GET = POST;
