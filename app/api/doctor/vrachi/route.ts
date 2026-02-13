/* path: app/api/doctor/vrachi/route.ts */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DoctorFileKind, DoctorStatus } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

function norm(s: any) {
  return String(s ?? '').trim();
}

function pickCrop(raw: any) {
  if (!raw || typeof raw !== 'object') return null;
  const x = Number((raw as any).x);
  const y = Number((raw as any).y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const specialityRaw = norm(url.searchParams.get('speciality'));
    if (!specialityRaw) {
      return NextResponse.json({ ok: false, error: 'NO_SPECIALITY' }, { status: 400 });
    }

    const speciality = specialityRaw;

    const doctors = await prisma.doctor.findMany({
      where: {
        status: DoctorStatus.APPROVED,
        OR: [
          { speciality1: { equals: speciality, mode: 'insensitive' } },
          { speciality2: { equals: speciality, mode: 'insensitive' } },
          { speciality3: { equals: speciality, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        city: true,
        speciality1: true,
        speciality2: true,
        speciality3: true,
        experienceYears: true,
        profilephotocrop: true,

        // ✅ ВОТ ОНО
        ratingSum: true,
        ratingCount: true,

        files: {
          where: { kind: DoctorFileKind.PROFILE_PHOTO },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { url: true },
          take: 1,
        },
      },
    });

    const items = doctors.map((d) => ({
      id: String(d.id),
      firstName: String(d.firstName ?? ''),
      lastName: String(d.lastName ?? ''),
      middleName: d.middleName ? String(d.middleName) : null,
      city: d.city ? String(d.city) : null,
      speciality1: String(d.speciality1 ?? ''),
      speciality2: d.speciality2 ? String(d.speciality2) : null,
      speciality3: d.speciality3 ? String(d.speciality3) : null,
      experienceYears: typeof d.experienceYears === 'number' ? d.experienceYears : null,
      avatarUrl: toPublicUrlMaybe(d.files?.[0]?.url ?? null),
      avatarCrop: pickCrop(d.profilephotocrop),

      // ✅ прокидываем агрегаты
      ratingSum: typeof d.ratingSum === 'number' ? d.ratingSum : Number(d.ratingSum ?? 0),
      ratingCount: typeof d.ratingCount === 'number' ? d.ratingCount : Number(d.ratingCount ?? 0),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED_TO_LOAD_DOCTORS' }, { status: 500 });
  }
}

export const POST = GET;
