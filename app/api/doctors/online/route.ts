/* path: app/api/doctors/online/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DoctorFileKind, DoctorStatus } from '@prisma/client';
import { verifyInitData, getInitDataFrom } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN =
  process.env.BOT_TOKEN ||
  process.env.TG_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  '';

function envClean(name: string) {
  return String(process.env[name] ?? '').replace(/[\r\n]/g, '').trim();
}

function toPublicUrlMaybe(value: string | null) {
  if (!value) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;

  const base = envClean('R2_PUBLIC_BASE_URL');
  if (!base) return v;

  return `${base.replace(/\/$/, '')}/${v}`;
}

function clampInt(x: any, min = 1, max = 200) {
  const n = typeof x === 'number' ? x : Number(x);
  if (!Number.isFinite(n)) return min;
  const v = Math.trunc(n);
  return Math.min(max, Math.max(min, v));
}

export async function GET(req: NextRequest) {
  try {
    const initData = await getInitDataFrom(req);
    if (!initData) {
      return NextResponse.json(
        { ok: false, error: 'NO_INIT_DATA', hint: 'Открой из Telegram.' },
        { status: 401 }
      );
    }
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });
    }
    if (!verifyInitData(initData, BOT_TOKEN)) {
      return NextResponse.json({ ok: false, error: 'BAD_INITDATA' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = clampInt(searchParams.get('limit') ?? 30, 1, 200);

    const doctors = await prisma.doctor.findMany({
      where: {
        status: DoctorStatus.APPROVED,
        isOnline: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        speciality1: true,
        speciality2: true,
        speciality3: true,
        experienceYears: true,
        files: {
          where: { kind: DoctorFileKind.PROFILE_PHOTO },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { url: true },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      count: doctors.length,
      items: doctors.map((d) => ({
        id: String(d.id),
        firstName: d.firstName ?? null,
        lastName: d.lastName ?? null,
        middleName: d.middleName ?? null,
        speciality1: d.speciality1 ?? null,
        speciality2: d.speciality2 ?? null,
        speciality3: d.speciality3 ?? null,
        experienceYears: typeof d.experienceYears === 'number' ? d.experienceYears : null,
        avatarUrl: toPublicUrlMaybe(d.files?.[0]?.url ?? null),
      })),
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
