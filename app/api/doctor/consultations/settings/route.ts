/* path: app/api/doctor/consultations/settings/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyInitData, getInitDataFrom, getTelegramIdStrict } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN =
  process.env.BOT_TOKEN ||
  process.env.TG_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  '';

function isProActive(proUntil: Date | null) {
  if (!proUntil) return false;
  const t = proUntil.getTime();
  if (!Number.isFinite(t)) return false;
  return t > Date.now();
}

function clampPriceRub(v: any) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 1000;
  return Math.max(1000, n);
}

export async function GET(req: NextRequest) {
  try {
    const initData = await getInitDataFrom(req);
    if (!initData) {
      return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });
    }
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });
    }
    if (!verifyInitData(initData, BOT_TOKEN)) {
      return NextResponse.json({ ok: false, error: 'BAD_INITDATA' }, { status: 401 });
    }

    const telegramId = getTelegramIdStrict(initData);

    const doctor = await prisma.doctor.findUnique({
      where: { telegramId },
      select: {
        id: true,
        proUntil: true,
        consultationEnabled: true,
        consultationPriceRub: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ ok: false, error: 'DOCTOR_NOT_FOUND' }, { status: 404 });
    }

    const proActive = isProActive(doctor.proUntil);

    return NextResponse.json(
      {
        ok: true,
        proActive,
        consultationEnabled: Boolean(doctor.consultationEnabled),
        consultationPriceRub: Number(doctor.consultationPriceRub ?? 1000),
        // ✅ благодарности — производное от PRO
        thanksEnabled: proActive,
        proUntil: doctor.proUntil ? doctor.proUntil.toISOString() : null,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR', hint: String(e?.message || '') }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const initData = await getInitDataFrom(req);
    if (!initData) {
      return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });
    }
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });
    }
    if (!verifyInitData(initData, BOT_TOKEN)) {
      return NextResponse.json({ ok: false, error: 'BAD_INITDATA' }, { status: 401 });
    }

    const telegramId = getTelegramIdStrict(initData);

    const doctor = await prisma.doctor.findUnique({
      where: { telegramId },
      select: {
        id: true,
        proUntil: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ ok: false, error: 'DOCTOR_NOT_FOUND' }, { status: 404 });
    }

    // ✅ менять настройки консультаций можно только при активном PRO
    if (!isProActive(doctor.proUntil)) {
      return NextResponse.json({ ok: false, error: 'PRO_REQUIRED' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
    }

    const consultationEnabled = Boolean((body as any).consultationEnabled);
    const consultationPriceRub = clampPriceRub((body as any).consultationPriceRub);

    await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        consultationEnabled,
        consultationPriceRub,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        consultationEnabled,
        consultationPriceRub,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR', hint: String(e?.message || '') }, { status: 500 });
  }
}
