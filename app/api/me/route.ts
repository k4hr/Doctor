/* path: app/api/me/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import {
  verifyInitData,
  getInitDataFrom,
  getTelegramUserUnsafe,
  getTelegramIdStrict,
} from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const ALLOW_BROWSER_DEBUG = (process.env.ALLOW_BROWSER_DEBUG || '').trim() === '1';

function isAdminTelegramId(id: string): boolean {
  // Серверная переменная (НЕ NEXT_PUBLIC)
  const raw = (process.env.ADMIN_TELEGRAM_IDS || '').trim();
  if (!raw) return false;
  const set = new Set(
    raw
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  );
  return set.has(id);
}

type TgUser = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

function normalizeUser(u: any): TgUser {
  return {
    id: String(u?.id ?? ''),
    username: u?.username ? String(u.username) : null,
    first_name: u?.first_name ? String(u.first_name) : null,
    last_name: u?.last_name ? String(u.last_name) : null,
  };
}

export async function POST(req: NextRequest) {
  try {
    // 1) initData из body
    const body = await req.json().catch(() => null);
    const initDataFromBody = typeof body?.initData === 'string' ? body.initData : '';

    // 2) initData из headers/query/cookie
    const initDataFromReq = getInitDataFrom(req);

    const initData = initDataFromBody || initDataFromReq;

    // 3) Debug fallback (ТОЛЬКО если включено)
    // пример: /api/me?debug=1&id=123456
    if (!initData && ALLOW_BROWSER_DEBUG) {
      const url = new URL(req.url);
      const debug = url.searchParams.get('debug') === '1';
      const id = (url.searchParams.get('id') || '').trim();

      if (debug && id && /^\d{3,20}$/.test(id)) {
        return NextResponse.json({
          ok: true,
          user: { id, username: null, first_name: 'Debug', last_name: 'Admin' },
          isAdmin: true,
          via: 'debug',
        });
      }
    }

    if (!initData) {
      return NextResponse.json(
        {
          ok: false,
          error: 'NO_INIT_DATA',
          hint:
            'Pass initData in JSON body {initData} or header x-telegram-init-data',
        },
        { status: 401 },
      );
    }

    if (!BOT_TOKEN) {
      return NextResponse.json(
        { ok: false, error: 'BOT_TOKEN_MISSING' },
        { status: 500 },
      );
    }

    // HMAC проверка
    if (!verifyInitData(initData, BOT_TOKEN)) {
      return NextResponse.json(
        { ok: false, error: 'BAD_INITDATA' },
        { status: 401 },
      );
    }

    const telegramId = getTelegramIdStrict(initData);
    const uUnsafe = getTelegramUserUnsafe(initData);

    const user = normalizeUser({ ...uUnsafe, id: telegramId });

    return NextResponse.json({
      ok: true,
      user,
      isAdmin: isAdminTelegramId(telegramId),
      via: 'initData',
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}

export const GET = POST;
