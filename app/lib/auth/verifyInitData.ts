import type { NextRequest } from 'next/server';
import crypto from 'crypto';

export type TgUser = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

export function verifyInitData(initData: string, botToken: string): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return false;

    params.delete('hash');

    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const computed = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // timing-safe compare
    const a = Buffer.from(computed, 'utf8');
    const b = Buffer.from(hash, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function extractTelegramId(initData: string): string | null {
  try {
    const p = new URLSearchParams(initData);
    const raw = p.get('user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (!u?.id) return null;
    return String(u.id);
  } catch {
    return null;
  }
}

export function extractTelegramUser(initData: string): TgUser | null {
  try {
    const p = new URLSearchParams(initData);
    const raw = p.get('user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (!u?.id) return null;

    return {
      id: String(u.id),
      username: u.username ? String(u.username) : null,
      first_name: u.first_name ? String(u.first_name) : null,
      last_name: u.last_name ? String(u.last_name) : null,
    };
  } catch {
    return null;
  }
}

/**
 * Берём initData из:
 * - JSON body { initData }
 * - header: x-telegram-init-data / x-init-data
 * - query: ?initData=...
 * - cookie: telegram_init_data (если захочешь)
 */
export async function getInitDataFrom(req: NextRequest): Promise<string> {
  // 1) headers
  const h =
    req.headers.get('x-telegram-init-data') ||
    req.headers.get('x-init-data') ||
    '';
  if (h) return h;

  // 2) query
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('initData') || '';
    if (q) return q;
  } catch {}

  // 3) cookies (опционально)
  try {
    const c = req.cookies.get('telegram_init_data')?.value || '';
    if (c) return c;
  } catch {}

  // 4) body
  try {
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await req.json().catch(() => null);
      const b = body?.initData;
      if (typeof b === 'string' && b.trim()) return b.trim();
    }
  } catch {}

  return '';
}
