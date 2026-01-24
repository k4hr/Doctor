/* path: app/api/doctor/register/route.ts */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

function verifyTelegramWebAppInitData(initData: string, botToken: string, maxAgeSec = 60 * 60 * 24) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false as const, error: 'NO_HASH' as const };

  const authDateStr = params.get('auth_date');
  if (!authDateStr) return { ok: false as const, error: 'NO_AUTH_DATE' as const };

  const authDate = Number(authDateStr);
  if (!Number.isFinite(authDate)) return { ok: false as const, error: 'BAD_AUTH_DATE' as const };

  const nowSec = Math.floor(Date.now() / 1000);
  if (authDate > nowSec + 60) return { ok: false as const, error: 'AUTH_DATE_IN_FUTURE' as const };
  if (nowSec - authDate > maxAgeSec) return { ok: false as const, error: 'INITDATA_EXPIRED' as const };

  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (!timingSafeEqualHex(computedHash, hash)) {
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
    const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    if (!botToken) {
      return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN', hint: 'Set TELEGRAM_BOT_TOKEN in env' }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
    }

    const initData = typeof (body as any).initData === 'string' ? String((body as any).initData).trim() : '';
    if (!initData) {
      return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });
    }

    const v = verifyTelegramWebAppInitData(initData, botToken);
    if (!v.ok) {
      return NextResponse.json({ ok: false, error: v.error }, { status: 401 });
    }

    const telegramId = v.user.id;

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
        return NextResponse.json({ ok: false, error: 'VALIDATION_ERROR', field: k }, { status: 400 });
      }
    }

    const genderRaw = String((body as any).gender).trim().toLowerCase();
    if (genderRaw !== 'male' && genderRaw !== 'female') {
      return NextResponse.json({ ok: false, error: 'VALIDATION_ERROR', field: 'gender' }, { status: 400 });
    }

    const experienceYears = Number((body as any).experienceYears);
    if (!Number.isFinite(experienceYears) || experienceYears < 0 || experienceYears > 70) {
      return NextResponse.json({ ok: false, error: 'VALIDATION_ERROR', field: 'experienceYears' }, { status: 400 });
    }

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
        gender: genderRaw,
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
      },
      update: {
        telegramUsername: v.user.username,
        telegramFirstName: v.user.first_name,
        telegramLastName: v.user.last_name,

        lastName: String((body as any).lastName).trim(),
        firstName: String((body as any).firstName).trim(),
        middleName: toStr((body as any).middleName),
        gender: genderRaw,
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
      },
    });

    return NextResponse.json({ ok: true, id: doctor.id, telegramId, status: doctor.status });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED_TO_SAVE' }, { status: 500 });
  }
}
