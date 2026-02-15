/* path: app/api/admin/doctor/pro/grant/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Plan = 'M1' | 'M3' | 'M6' | 'Y1';

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

function addMonths(d: Date, months: number) {
  const x = new Date(d.getTime());
  const day = x.getDate();
  x.setMonth(x.getMonth() + months);

  if (x.getDate() < day) {
    x.setDate(0);
  }
  return x;
}

function computeEndsAt(from: Date, plan: Plan) {
  if (plan === 'M1') return addMonths(from, 1);
  if (plan === 'M3') return addMonths(from, 3);
  if (plan === 'M6') return addMonths(from, 6);
  return addMonths(from, 12);
}

function cleanPlan(v: any): Plan {
  const p = String(v || '').trim().toUpperCase();
  if (p === 'M1' || p === 'M3' || p === 'M6' || p === 'Y1') return p as Plan;
  return 'M1';
}

export async function POST(req: NextRequest) {
  try {
    const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    if (!botToken) return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 });

    const initData = getInitDataFromRequest(req);
    if (!initData) return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });

    const adminTgId = verifyAndExtractTelegramId(initData, botToken);
    if (!adminTgId) return NextResponse.json({ ok: false, error: 'BAD_INITDATA' }, { status: 401 });

    if (!isAdmin(adminTgId)) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
    }

    const doctorId = String((body as any).doctorId || '').trim();
    if (!doctorId) return NextResponse.json({ ok: false, error: 'NO_DOCTOR_ID' }, { status: 400 });

    const plan = cleanPlan((body as any).plan);

    const now = new Date();

    // ✅ FIX: продление, а не наложение
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, proUntil: true },
    });

    if (!doctor) return NextResponse.json({ ok: false, error: 'DOCTOR_NOT_FOUND' }, { status: 404 });

    const base =
      doctor.proUntil && doctor.proUntil.getTime() > now.getTime()
        ? new Date(doctor.proUntil.getTime())
        : now;

    const endsAt = computeEndsAt(base, plan);

    await prisma.$transaction(async (tx) => {
      await tx.doctorProSubscription.create({
        data: {
          doctorId: doctorId,
          status: 'ACTIVE',
          plan: plan,
          startsAt: base,
          endsAt: endsAt,
          priceRub: 0,
          provider: 'ADMIN',
          meta: { grantedByTelegramId: String(adminTgId) },
        },
      });

      // ✅ PRO => открываем консультации и благодарности + ставим новый proUntil
      await tx.doctor.update({
        where: { id: doctorId },
        data: {
          proUntil: endsAt,
          consultationEnabled: true,
          thanksEnabled: true,
        },
      });
    });

    return NextResponse.json(
      { ok: true, doctorId, proUntil: endsAt.toISOString(), plan },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR', hint: String(e?.message || '') }, { status: 500 });
  }
}

export const GET = POST;
