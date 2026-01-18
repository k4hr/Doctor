/* path: lib/auth/verifyInitData.ts */
import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';

/** secret = HMAC_SHA256(key="WebAppData", data=BOT_TOKEN) */
function buildSecret(botToken: string): Buffer {
  return crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
}

/** Data Check String: все пары кроме hash, сортировка по ключу */
function buildDataCheckString(params: URLSearchParams): string {
  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key === 'hash') return;
    pairs.push(`${key}=${value}`);
  });
  pairs.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return pairs.join('\n');
}

/** Строгая boolean-валидация initData (HMAC) */
export function verifyInitData(initData: string, botToken: string): boolean {
  try {
    if (!initData || !botToken) return false;

    const params = new URLSearchParams(initData);
    const gotHash = params.get('hash');
    if (!gotHash) return false;

    const dcs = buildDataCheckString(params);
    const secret = buildSecret(botToken);
    const expected = crypto.createHmac('sha256', secret).update(dcs).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(gotHash, 'hex'));
  } catch {
    return false;
  }
}

/** Возвращает Telegram ID или null */
export function getTelegramId(initData: string): string | null {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr) as { id?: number | string };
    if (!user?.id) return null;
    return String(user.id);
  } catch {
    return null;
  }
}

/** Жёсткая версия — бросает, если ID не найден */
export function getTelegramIdStrict(initData: string): string {
  const id = getTelegramId(initData);
  if (!id) throw new Error('NO_TELEGRAM_ID');
  return id;
}

/**
 * Достаём initData из:
 *  - headers: x-telegram-init-data / x-init-data / x-tg-init-data (любой регистр)
 *  - query: ?initData=
 *  - cookie: tg_init_data
 *  - body json: { initData }
 */
export async function getInitDataFrom(req: NextRequest): Promise<string> {
  try {
    // 1) Headers
    const headerCandidates = [
      'x-telegram-init-data',
      'x-tg-init-data',
      'x-init-data',
      'X-Telegram-Init-Data',
      'X-Tg-Init-Data',
      'X-Init-Data',
    ];

    for (const h of headerCandidates) {
      const v = req.headers.get(h);
      if (v) return v;
      const v2 = req.headers.get(h.toLowerCase());
      if (v2) return v2;
    }

    // 2) Query
    try {
      const url = new URL(req.url);
      const q = url.searchParams.get('initData') || '';
      if (q) return q;
    } catch {}

    // 3) Cookie
    try {
      const c = req.cookies.get('tg_init_data')?.value || '';
      if (c) return c;
    } catch {}

    // 4) JSON body { initData }
    try {
      const ct = req.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const body = await req.clone().json().catch(() => null);
        const initData = body?.initData;
        if (typeof initData === 'string' && initData) return initData;
      }
    } catch {}
  } catch {}

  return '';
}

/** алиас совместимости */
export function extractTelegramId(initData: string): string {
  return getTelegramId(initData) ?? '';
}
