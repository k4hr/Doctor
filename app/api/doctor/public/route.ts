/* path: app/api/doctor/public/route.ts */
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = String(searchParams.get('doctorId') || '').trim();

    if (!doctorId) {
      return NextResponse.json({ ok: false, error: 'NO_DOCTOR_ID' }, { status: 400 });
    }

    const d = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        status: true,

        firstName: true,
        lastName: true,
        middleName: true,
        city: true,

        speciality1: true,
        speciality2: true,
        speciality3: true,
        experienceYears: true,

        about: true,
        specialityDetails: true,
        experienceDetails: true,
        education: true,
        workplace: true,
        position: true,

        files: {
          where: { kind: DoctorFileKind.PROFILE_PHOTO },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { url: true },
          take: 1,
        },
      },
    });

    if (!d) {
      return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
    }

    // Публично показываем только одобренных
    if (d.status !== DoctorStatus.APPROVED) {
      return NextResponse.json({ ok: false, error: 'NOT_APPROVED' }, { status: 403 });
    }

    const avatarUrl = toPublicUrlMaybe(d.files?.[0]?.url ?? null);

    // "консультаций" = кол-во ответов врача (можно потом заменить на твою бизнес-логику)
    const consultationsCount = await prisma.answer.count({
      where: { doctorId: d.id, isDeleted: false },
    });

    return NextResponse.json({
      ok: true,
      doctor: {
        id: d.id,
        status: d.status,
        firstName: d.firstName,
        lastName: d.lastName,
        middleName: d.middleName,
        city: d.city,

        speciality1: d.speciality1,
        speciality2: d.speciality2,
        speciality3: d.speciality3,
        experienceYears: d.experienceYears,

        about: d.about,
        specialityDetails: d.specialityDetails,
        experienceDetails: d.experienceDetails,
        education: d.education,
        workplace: d.workplace,
        position: d.position,

        avatarUrl,

        stats: {
          consultationsCount,
        },
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 });
  }
}
