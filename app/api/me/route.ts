/* path: app/api/me/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import { verifyInitData, getInitDataFrom, getTelegramIdStrict } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '';
const ALLOW_BROWSER_DEBUG =
  (process.env.ALLOW_BROWSER_DEBUG || process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG || '').trim() === '1';

function extractUnsafeUserFromTg(initData: string): {
  id?: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
} | null {
  try {
    const p = new URLSearchParams(initData);
    const raw = p.get('user');
    return raw ? (JSON.parse(raw) as any) : null;
  } catch {
    return null;
  }
}

function isAdminId(telegramId: string): boolean {
  const raw =
    (process.env.ADMIN_TELEGRAM_IDS ||
      process.env.NEXT_PUBLIC_ADMIN_TELEGRAM_IDS ||
      '').trim();

  if (!raw) return false;

  const set = new Set(
    raw
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
  );

  return set.has(String(telegramId));
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // Debug режим (если initData реально нет)
    if (ALLOW_BROWSER_DEBUG) {
      const id = (url.searchParams.get('id') || '').trim();
      if (id) {
        return NextResponse.json({
          ok: true,
          user: { id, username: null, first_name: null, last_name: null },
          isAdmin: isAdminId(id),
          via: 'debugId',
        });
      }
    }

    // Telegram initData из headers/query/cookie/body
    const initData = await getInitDataFrom(req);

    if (!initData) {
      return NextResponse.json(
        {
          ok: false,
          error: 'NO_INIT_DATA',
          hint: 'Pass initData in JSON body {initData} or header x-telegram-init-data or cookie tg_init_data',
        },
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
    const u = extractUnsafeUserFromTg(initData);

    return NextResponse.json({
      ok: true,
      user: {
        id: telegramId,
        username: u?.username ? String(u.username) : null,
        first_name: u?.first_name ? String(u.first_name) : null,
        last_name: u?.last_name ? String(u.last_name) : null,
      },
      isAdmin: isAdminId(telegramId),
      via: 'initData',
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

export const GET = POST;
