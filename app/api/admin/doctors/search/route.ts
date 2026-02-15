/* path: app/api/admin/doctors/search/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
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

function getInitDataFromRequest(req: NextRequest): string {
  const h =
    req.headers.get('x-telegram-init-data') ||
    req.headers.get('x-init-data') ||
    req.headers.get('x-tg-init-data') ||
    '';
  if (h) return String(h).trim();

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
  if (!base) return v;
  return `${base.replace(/\/$/, '')}/${v}`;
}

export async function GET(req: NextRequest) {
  try {
    const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    if (!botToken) return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 });

    const initData = getInitDataFromRequest(req);
    if (!initData) return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });

    const telegramId = verifyAndExtractTelegramId(initData, botToken);
    if (!telegramId) return NextResponse.json({ ok: false, error: 'BAD_INITDATA' }, { status: 401 });

    if (!isAdmin(telegramId)) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });

    const url = new URL(req.url);
    const qRaw = String(url.searchParams.get('q') || '').trim();
    const limitRaw = Number(url.searchParams.get('limit') || '30');
    const take = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, Math.trunc(limitRaw))) : 30;

    if (!qRaw || qRaw.length < 2) return NextResponse.json({ ok: true, items: [] });

    const where: any = {
      OR: [
        { id: { contains: qRaw, mode: 'insensitive' } },
        { telegramId: { contains: qRaw, mode: 'insensitive' } },
        { telegramUsername: { contains: qRaw, mode: 'insensitive' } },
        { telegramFirstName: { contains: qRaw, mode: 'insensitive' } },
        { telegramLastName: { contains: qRaw, mode: 'insensitive' } },
        { firstName: { contains: qRaw, mode: 'insensitive' } },
        { lastName: { contains: qRaw, mode: 'insensitive' } },
        { middleName: { contains: qRaw, mode: 'insensitive' } },
      ],
    };

    const list = await prisma.doctor.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      take,
      select: {
        id: true,
        status: true,

        telegramId: true,
        telegramUsername: true,
        telegramFirstName: true,
        telegramLastName: true,

        firstName: true,
        lastName: true,
        middleName: true,

        speciality1: true,
        city: true,

        proUntil: true,
        consultationEnabled: true,
        consultationPriceRub: true,
        thanksEnabled: true,

        profilephotourl: true,
      },
    });

    const items = list.map((d) => ({
      id: d.id,
      status: String(d.status),

      telegramId: String(d.telegramId),
      telegramUsername: d.telegramUsername ?? null,
      telegramFirstName: d.telegramFirstName ?? null,
      telegramLastName: d.telegramLastName ?? null,

      firstName: d.firstName,
      lastName: d.lastName,
      middleName: d.middleName ?? null,

      speciality1: d.speciality1 ?? null,
      city: d.city ?? null,

      proUntil: d.proUntil ? d.proUntil.toISOString() : null,
      consultationEnabled: Boolean(d.consultationEnabled),
      consultationPriceRub: Number(d.consultationPriceRub ?? 1000),
      thanksEnabled: Boolean(d.thanksEnabled),

      avatarUrl: toPublicUrlMaybe(d.profilephotourl ?? null),
    }));

    return NextResponse.json({ ok: true, items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR', hint: String(e?.message || '') }, { status: 500 });
  }
}

export const POST = GET;
