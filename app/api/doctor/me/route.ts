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

function statusGate(status: DoctorStatus) {
  // Это правило можно менять как хочешь:
  // - APPROVED: полный доступ к кабинету врача
  // - PENDING: только “на модерации”
  // - NEED_FIX: только “нужно исправить”
  // - REJECTED: “отклонено”
  // - DRAFT: “не отправлено”
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
      },
    });

    // ✅ Важно: если пользователь валиден, но не врач — возвращаем ok:true + isDoctor:false
    if (!doctor) {
      return NextResponse.json({
        ok: true,
        telegramId,
        isDoctor: false,
        doctor: null,
      });
    }

    const gate = statusGate(doctor.status);

    return NextResponse.json({
      ok: true,
      telegramId,
      isDoctor: true,
      doctor: {
        ...doctor,
        statusRu: gate.labelRu,
        canAccessDoctorCabinet: gate.canAccessDoctorCabinet,
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

export const POST = GET;
