/* path: app/api/doctor/online/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DoctorStatus } from '@prisma/client';
import { verifyInitData, getInitDataFrom, getTelegramIdStrict } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN =
  process.env.BOT_TOKEN ||
  process.env.TG_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  '';

function cleanBool(v: any): boolean | null {
  if (v === true) return true;
  if (v === false) return false;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
    if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
  }
  if (typeof v === 'number') {
    if (v === 1) return true;
    if (v === 0) return false;
  }
  return null;
}

async function authDoctor(req: NextRequest) {
  const initData = await getInitDataFrom(req);
  if (!initData) {
    return {
      ok: false as const,
      res: NextResponse.json(
        { ok: false, error: 'NO_INIT_DATA', hint: 'Открой из Telegram.' },
        { status: 401 }
      ),
    };
  }
  if (!BOT_TOKEN) {
    return {
      ok: false as const,
      res: NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 }),
    };
  }
  if (!verifyInitData(initData, BOT_TOKEN)) {
    return {
      ok: false as const,
      res: NextResponse.json({ ok: false, error: 'BAD_INITDATA' }, { status: 401 }),
    };
  }

  const telegramId = getTelegramIdStrict(initData);

  const doctor = await prisma.doctor.findUnique({
    where: { telegramId },
    select: { id: true, status: true, isOnline: true },
  });

  if (!doctor || doctor.status !== DoctorStatus.APPROVED) {
    return {
      ok: false as const,
      res: NextResponse.json({ ok: false, error: 'NOT_APPROVED_DOCTOR' }, { status: 403 }),
    };
  }

  return { ok: true as const, doctor };
}

export async function GET(req: NextRequest) {
  try {
    const a = await authDoctor(req);
    if (!a.ok) return a.res;

    return NextResponse.json({
      ok: true,
      doctorId: String(a.doctor.id),
      isOnline: !!a.doctor.isOnline,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const a = await authDoctor(req);
    if (!a.ok) return a.res;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
    }

    const b = cleanBool((body as any).isOnline);
    if (b === null) {
      return NextResponse.json({ ok: false, error: 'VALIDATION', field: 'isOnline' }, { status: 400 });
    }

    const updated = await prisma.doctor.update({
      where: { id: a.doctor.id },
      data: { isOnline: b },
      select: { id: true, isOnline: true },
    });

    return NextResponse.json({
      ok: true,
      doctorId: String(updated.id),
      isOnline: !!updated.isOnline,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
