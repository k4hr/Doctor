/* path: app/api/doctor/register/route.ts */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

type TgUser = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

function toInt(v: any): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toStr(v: any): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function verifyTelegramWebAppInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false as const, error: 'NO_HASH' as const };

  params.delete('hash');

  // data_check_string
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  // secret_key = HMAC_SHA256("WebAppData", bot_token)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  // hash = HMAC_SHA256(secret_key, data_check_string)
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash !== hash) return { ok: false as const, error: 'BAD_HASH' as const };

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

export async function POST(req: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { ok: false, error: 'NO_BOT_TOKEN', hint: 'Set TELEGRAM_BOT_TOKEN in env' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
    }

    const initData = body?.initData as string | undefined;
    if (!initData) {
      return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });
    }

    const v = verifyTelegramWebAppInitData(initData, botToken);
    if (!v.ok) {
      return NextResponse.json({ ok: false, error: v.error }, { status: 401 });
    }

    const telegramId = v.user.id;

    // минимальная валидация обязательных полей формы
    const required = [
      'lastName',
      'firstName',
      'gender',
      'speciality1',
      'education',
      'experienceYears',
      'email',
      'about',
      'specialityDetails',
      'experienceDetails',
    ] as const;

    for (const k of required) {
      const val = body?.[k];
      if (val === undefined || val === null || String(val).trim() === '') {
        return NextResponse.json(
          { ok: false, error: 'VALIDATION_ERROR', field: k },
          { status: 400 }
        );
      }
    }

    const experienceYears = Number(body.experienceYears);
    if (!Number.isFinite(experienceYears) || experienceYears < 0 || experienceYears > 70) {
      return NextResponse.json(
        { ok: false, error: 'VALIDATION_ERROR', field: 'experienceYears' },
        { status: 400 }
      );
    }

    // Upsert врача по telegramId (привязка к Telegram-пользователю)
    const doctor = await prisma.doctor.upsert({
      where: { telegramId },
      create: {
        telegramId,
        telegramUsername: v.user.username,
        telegramFirstName: v.user.first_name,
        telegramLastName: v.user.last_name,

        lastName: String(body.lastName).trim(),
        firstName: String(body.firstName).trim(),
        middleName: toStr(body.middleName),
        gender: String(body.gender).trim(),
        birthDay: toInt(body.birthDay),
        birthMonth: toInt(body.birthMonth),
        birthYear: toInt(body.birthYear),
        city: toStr(body.city),

        speciality1: String(body.speciality1).trim(),
        speciality2: toStr(body.speciality2),
        speciality3: toStr(body.speciality3),
        education: String(body.education).trim(),
        degree: toStr(body.degree),
        workplace: toStr(body.workplace),
        position: toStr(body.position),
        experienceYears,
        awards: toStr(body.awards),

        email: String(body.email).trim(),

        about: String(body.about).trim(),
        specialityDetails: String(body.specialityDetails).trim(),
        experienceDetails: String(body.experienceDetails).trim(),
        courses: toStr(body.courses),
        achievements: toStr(body.achievements),
        publications: toStr(body.publications),
      },
      update: {
        telegramUsername: v.user.username,
        telegramFirstName: v.user.first_name,
        telegramLastName: v.user.last_name,

        lastName: String(body.lastName).trim(),
        firstName: String(body.firstName).trim(),
        middleName: toStr(body.middleName),
        gender: String(body.gender).trim(),
        birthDay: toInt(body.birthDay),
        birthMonth: toInt(body.birthMonth),
        birthYear: toInt(body.birthYear),
        city: toStr(body.city),

        speciality1: String(body.speciality1).trim(),
        speciality2: toStr(body.speciality2),
        speciality3: toStr(body.speciality3),
        education: String(body.education).trim(),
        degree: toStr(body.degree),
        workplace: toStr(body.workplace),
        position: toStr(body.position),
        experienceYears,
        awards: toStr(body.awards),

        email: String(body.email).trim(),

        about: String(body.about).trim(),
        specialityDetails: String(body.specialityDetails).trim(),
        experienceDetails: String(body.experienceDetails).trim(),
        courses: toStr(body.courses),
        achievements: toStr(body.achievements),
        publications: toStr(body.publications),

        // если хочешь — при редактировании сбрасывать на модерацию:
        // status: 'PENDING',
      },
    });

    return NextResponse.json({
      ok: true,
      id: doctor.id,
      telegramId,
      status: doctor.status,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED_TO_SAVE' }, { status: 500 });
  }
}
