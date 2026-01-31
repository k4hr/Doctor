/* path: app/api/doctor/me/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DoctorFileKind, DoctorStatus } from '@prisma/client';
import { verifyInitData, getInitDataFrom, getTelegramIdStrict } from '@/lib/auth/verifyInitData';

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

function statusGate(status: DoctorStatus) {
  const canAccessDoctorCabinet = status === DoctorStatus.APPROVED;

  const labelRu =
    status === DoctorStatus.APPROVED
      ? 'Одобрена'
      : status === DoctorStatus.PENDING
        ? 'На модерации'
        : status === DoctorStatus.NEED_FIX
          ? 'Нужно исправить'
          : status === DoctorStatus.REJECTED
            ? 'Отклонена'
            : 'Черновик';

  return { canAccessDoctorCabinet, labelRu };
}

export async function GET(req: NextRequest) {
  try {
    const initData = await getInitDataFrom(req);

    if (!initData) {
      return NextResponse.json(
        { ok: false, error: 'NO_INIT_DATA', hint: 'Открой из Telegram WebApp (initData обязателен).' },
        { status: 401 }
      );
    }

    if (!BOT_TOKEN) {
      return NextResponse.json(
        { ok: false, error: 'BOT_TOKEN_MISSING', hint: 'Set BOT_TOKEN/TG_BOT_TOKEN/TELEGRAM_BOT_TOKEN in env' },
        { status: 500 }
      );
    }

    if (!verifyInitData(initData, BOT_TOKEN)) {
      return NextResponse.json({ ok: false, error: 'BAD_INITDATA' }, { status: 401 });
    }

    const telegramId = getTelegramIdStrict(initData);

    const doctor = await prisma.doctor.findUnique({
      where: { telegramId },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        createdAt: true,
        updatedAt: true,

        firstName: true,
        lastName: true,
        middleName: true,
        city: true,
        speciality1: true,
        speciality2: true,
        speciality3: true,
        experienceYears: true,

        // ✅ поля для красивого профиля (как на фото)
        about: true,
        specialityDetails: true,
        experienceDetails: true,
        education: true,
        workplace: true,
        position: true,

        // ✅ аватар профиля
        files: {
          where: { kind: DoctorFileKind.PROFILE_PHOTO },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { url: true },
          take: 1,
        },
      },
    });

    // ✅ если пользователь валиден, но не врач
    if (!doctor) {
      return NextResponse.json({
        ok: true,
        telegramId,
        isDoctor: false,
        doctor: null,
      });
    }

    const gate = statusGate(doctor.status);

    // ✅ счётчики (если у тебя консультация = ответ врача)
    let consultationsCount = 0;
    try {
      consultationsCount = await prisma.answer.count({
        where: { doctorId: doctor.id, isDeleted: false },
      });
    } catch {
      consultationsCount = 0;
    }

    // ✅ отзывы: пока 0, пока не подключишь модель отзывов
    const reviewsCount = 0;

    return NextResponse.json({
      ok: true,
      telegramId,
      isDoctor: true,
      doctor: {
        id: String(doctor.id),
        status: doctor.status,
        statusRu: gate.labelRu,
        canAccessDoctorCabinet: gate.canAccessDoctorCabinet,

        firstName: doctor.firstName,
        lastName: doctor.lastName,
        middleName: doctor.middleName,
        city: doctor.city,
        speciality1: doctor.speciality1,
        speciality2: doctor.speciality2,
        speciality3: doctor.speciality3,
        experienceYears: typeof doctor.experienceYears === 'number' ? doctor.experienceYears : null,

        about: doctor.about ?? null,
        specialityDetails: doctor.specialityDetails ?? null,
        experienceDetails: doctor.experienceDetails ?? null,
        education: doctor.education ?? null,
        workplace: doctor.workplace ?? null,
        position: doctor.position ?? null,

        avatarUrl: toPublicUrlMaybe(doctor.files?.[0]?.url ?? null),

        stats: {
          consultationsCount,
          reviewsCount,
        },
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

export const POST = GET;
