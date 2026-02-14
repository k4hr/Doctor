/* path: app/api/thanks/create/route.ts */
import { NextResponse } from 'next/server';
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

function envClean(name: string) {
  return String(process.env[name] ?? '').replace(/[\r\n]/g, '').trim();
}

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

function verifyTelegramWebAppInitData(initData: string, botToken: string, maxAgeSec = 60 * 60 * 24) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false as const, error: 'NO_HASH' as const };

  const authDateStr = params.get('auth_date');
  if (!authDateStr) return { ok: false as const, error: 'NO_AUTH_DATE' as const };

  const authDate = Number(authDateStr);
  if (!Number.isFinite(authDate)) return { ok: false as const, error: 'BAD_AUTH_DATE' as const };

  const nowSec = Math.floor(Date.now() / 1000);
  if (authDate > nowSec + 60) return { ok: false as const, error: 'AUTH_DATE_IN_FUTURE' as const };
  if (nowSec - authDate > maxAgeSec) return { ok: false as const, error: 'INITDATA_EXPIRED' as const };

  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (!timingSafeEqualHex(computedHash, hash)) {
    return { ok: false as const, error: 'BAD_HASH' as const };
  }

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
}

function isProActive(proUntil: Date | null) {
  if (!proUntil) return false;
  const t = proUntil.getTime();
  if (!Number.isFinite(t)) return false;
  return t > Date.now();
}

function clampAmountRub(v: any) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 0;
  // минималку можешь поменять; я поставил 100 как здравый порог
  return Math.max(100, Math.min(200_000, n));
}

function clampText(s: any, max = 400) {
  const t = String(s ?? '').trim();
  if (!t) return null;
  if (t.length <= max) return t;
  return t.slice(0, max);
}

export async function POST(req: Request) {
  try {
    const botToken = envClean('TELEGRAM_BOT_TOKEN');
    if (!botToken) return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
    }

    const initData = typeof (body as any).initData === 'string' ? String((body as any).initData).trim() : '';
    if (!initData) return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });

    const v = verifyTelegramWebAppInitData(initData, botToken);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 401 });

    const doctorId = String((body as any).doctorId ?? '').trim();
    if (!doctorId) return NextResponse.json({ ok: false, error: 'NO_DOCTOR' }, { status: 400 });

    const amountRub = clampAmountRub((body as any).amountRub);
    if (amountRub < 100) return NextResponse.json({ ok: false, error: 'AMOUNT_TOO_SMALL', minRub: 100 }, { status: 400 });

    const message = clampText((body as any).message, 400);

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, proUntil: true },
    });

    if (!doctor) return NextResponse.json({ ok: false, error: 'DOCTOR_NOT_FOUND' }, { status: 404 });

    // ✅ благодарности только при активном PRO
    if (!isProActive(doctor.proUntil)) {
      return NextResponse.json({ ok: false, error: 'PRO_REQUIRED' }, { status: 403 });
    }

    const t = await prisma.thanks.create({
      data: {
        doctorId: doctor.id,
        authorTelegramId: String(v.user.id),
        authorUsername: v.user.username,
        authorFirstName: v.user.first_name,
        authorLastName: v.user.last_name,
        authorIsAnonymous: true,
        amountRub,
        message,
        status: 'DRAFT',
      },
      select: { id: true, amountRub: true },
    });

    return NextResponse.json({ ok: true, thanksId: t.id, amountRub: t.amountRub }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED_CREATE', hint: String(e?.message || '') }, { status: 500 });
  }
}

export const GET = POST;
