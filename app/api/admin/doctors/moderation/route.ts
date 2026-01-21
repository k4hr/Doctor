/* path: app/api/admin/doctors/moderation/route.ts */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

function getInitDataFromRequest(req: Request): string {
  const h =
    req.headers.get('x-telegram-init-data') ||
    req.headers.get('x-init-data') ||
    req.headers.get('x-tg-init-data') ||
    '';
  if (h) return h;

  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(/(?:^|;\s*)tg_init_data=([^;]+)/i);
  return m?.[1] ? decodeURIComponent(m[1]) : '';
}

function isAdmin(telegramId: string) {
  const raw = (process.env.ADMIN_TG_IDS || '').trim();
  if (!raw) return false;
  const set = new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  return set.has(String(telegramId));
}

function toPublicUrlMaybe(value: string | null) {
  if (!value) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;

  const base = (process.env.R2_PUBLIC_BASE_URL || '').trim();
  if (!base) return v; // оставим как key
  return `${base.replace(/\/$/, '')}/${v}`;
}

function parseMaybeJsonArray(value: string | null): string[] {
  if (!value) return [];
  const v = String(value).trim();
  if (!v) return [];
  // если это JSON-массив строк (как мы пишем при множественной загрузке)
  if (v.startsWith('[')) {
    try {
      const arr = JSON.parse(v);
      if (Array.isArray(arr)) {
        return arr.map((x) => String(x)).filter(Boolean);
      }
    } catch {
      // игнор
    }
  }
  return [v];
}

export async function GET(req: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 });

    const initData = getInitDataFromRequest(req);
    if (!initData) return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });

    const telegramId = verifyAndExtractTelegramId(initData, botToken);
    if (!telegramId) return NextResponse.json({ ok: false, error: 'BAD_INITDATA' }, { status: 401 });

    if (!isAdmin(telegramId)) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });

    const list = await prisma.doctor.findMany({
      where: {
        status: { in: ['PENDING', 'NEED_FIX'] },
        submittedAt: { not: null },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        status: true,
        updatedAt: true,
        submittedAt: true,
        telegramId: true,
        telegramUsername: true,
        telegramFirstName: true,
        telegramLastName: true,
        firstName: true,
        lastName: true,
        city: true,
        speciality1: true,
        experienceYears: true,
        profilePhotoUrl: true,
        diplomaPhotoUrl: true,
      },
    });

    const items = list.map((d) => {
      const profileArr = parseMaybeJsonArray(d.profilePhotoUrl).map((x) => toPublicUrlMaybe(x)).filter(Boolean) as string[];
      const docsArr = parseMaybeJsonArray(d.diplomaPhotoUrl).map((x) => toPublicUrlMaybe(x)).filter(Boolean) as string[];

      return {
        ...d,

        // ✅ совместимость со старым UI/типами (одно превью)
        profilePhotoUrl: profileArr[0] || null,
        diplomaPhotoUrl: docsArr[0] || null,

        // ✅ новый формат (мульти)
        profilePhotoUrls: profileArr,
        diplomaPhotoUrls: docsArr,
      };
    });

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 });
  }
}
