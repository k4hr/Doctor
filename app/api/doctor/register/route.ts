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

/**
 * Telegram WebApp initData verification (official algorithm):
 * - data_check_string: sorted params (except hash) joined with \n
 * - secret_key = HMAC_SHA256("WebAppData", bot_token)
 * - computed_hash = HMAC_SHA256(secret_key, data_check_string)
 */
function verifyTelegramWebAppInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false as const, error: 'NO_HASH' as const };

  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash !== hash) {
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
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
    }

    const initData = typeof body.initData === 'string' ? body.initData : '';
    if (!initData) {
      return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });
    }

    const v = verifyTelegramWebAppInitData(initData, botToken);
    if (!v.ok) {
      return NextResponse.json({ ok: false, error: v.error }, { status: 401 });
    }

    const telegramId = v.user.id;

    // обязательные поля
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
      const val = (body as any)[k];
      if (val === undefined || val === null || String(val).trim() === '') {
        return NextResponse.json(
          { ok: false, error: 'VALIDATION_ERROR', field: k },
          { status: 400 }
        );
      }
    }

    const experienceYears = Number((body as any).experienceYears);
    if (!Number.isFinite(experienceYears) || experienceYears < 0 || experienceYears > 70) {
      return NextResponse.json(
        { ok: false, error: 'VALIDATION_ERROR', field: 'experienceYears' },
        { status: 400 }
      );
    }

    // создаём/обновляем анкету по telegramId
    const doctor = await prisma.doctor.upsert({
      where: { telegramId },
      create: {
        telegramId,
        telegramUsername: v.user.username,
        telegramFirstName: v.user.first_name,
        telegramLastName: v.user.last_name,

        lastName: String((body as any).lastName).trim(),
        firstName: String((body as any).firstName).trim(),
        middleName: toStr((body as any).middleName),
        gender: String((body as any).gender).trim(),
        birthDay: toInt((body as any).birthDay),
        birthMonth: toInt((body as any).birthMonth),
        birthYear: toInt((body as any).birthYear),
        city: toStr((body as any).city),

        speciality1: String((body as any).speciality1).trim(),
        speciality2: toStr((body as any).speciality2),
        speciality3: toStr((body as any).speciality3),
        education: String((body as any).education).trim(),
        degree: toStr((body as any).degree),
        workplace: toStr((body as any).workplace),
        position: toStr((body as any).position),
        experienceYears,
        awards: toStr((body as any).awards),

        email: String((body as any).email).trim(),

        about: String((body as any).about).trim(),
        specialityDetails: String((body as any).specialityDetails).trim(),
        experienceDetails: String((body as any).experienceDetails).trim(),
        courses: toStr((body as any).courses),
        achievements: toStr((body as any).achievements),
        publications: toStr((body as any).publications),

        // статус по умолчанию PENDING (в схеме)
      },
      update: {
        telegramUsername: v.user.username,
        telegramFirstName: v.user.first_name,
        telegramLastName: v.user.last_name,

        lastName: String((body as any).lastName).trim(),
        firstName: String((body as any).firstName).trim(),
        middleName: toStr((body as any).middleName),
        gender: String((body as any).gender).trim(),
        birthDay: toInt((body as any).birthDay),
        birthMonth: toInt((body as any).birthMonth),
        birthYear: toInt((body as any).birthYear),
        city: toStr((body as any).city),

        speciality1: String((body as any).speciality1).trim(),
        speciality2: toStr((body as any).speciality2),
        speciality3: toStr((body as any).speciality3),
        education: String((body as any).education).trim(),
        degree: toStr((body as any).degree),
        workplace: toStr((body as any).workplace),
        position: toStr((body as any).position),
        experienceYears,
        awards: toStr((body as any).awards),

        email: String((body as any).email).trim(),

        about: String((body as any).about).trim(),
        specialityDetails: String((body as any).specialityDetails).trim(),
        experienceDetails: String((body as any).experienceDetails).trim(),
        courses: toStr((body as any).courses),
        achievements: toStr((body as any).achievements),
        publications: toStr((body as any).publications),

        // хочешь при каждом редактировании снова на модерацию — раскомментируй:
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
