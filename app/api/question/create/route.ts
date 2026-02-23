/* path: app/api/question/create/route.ts */
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

function parseKeywords(raw: any): string[] {
  const s = String(raw ?? '').trim();
  if (!s) return [];
  const arr = s
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(arr)).slice(0, 20);
}

function clampInt(n: any, def: number, min: number, max: number) {
  const x = Number(n);
  if (!Number.isFinite(x)) return def;
  return Math.max(min, Math.min(max, Math.floor(x)));
}

export async function POST(req: Request) {
  try {
    const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    if (!botToken) {
      return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
    }

    const initData = typeof (body as any).initData === 'string' ? String((body as any).initData).trim() : '';
    if (!initData) return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });

    const v = verifyTelegramWebAppInitData(initData, botToken);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 401 });

    const speciality = String((body as any).speciality || '').trim();
    const title = String((body as any).title || '').trim();
    const qBody = String((body as any).body || '').trim();
    const keywords = parseKeywords((body as any).keywords);

    const authorIsAnonymous =
      typeof (body as any).authorIsAnonymous === 'boolean' ? Boolean((body as any).authorIsAnonymous) : true;

    const assignedDoctorId = (body as any).assignedDoctorId ? String((body as any).assignedDoctorId).trim() : null;

    // ✅ новое: платность
    const isFree = typeof (body as any).isFree === 'boolean' ? Boolean((body as any).isFree) : true;
    const priceRubRaw = (body as any).priceRub;
    const priceRub = clampInt(priceRubRaw, 0, 0, 100_000);

    if (!speciality) return NextResponse.json({ ok: false, error: 'VALIDATION', field: 'speciality' }, { status: 400 });
    if (title.length < 6) return NextResponse.json({ ok: false, error: 'VALIDATION', field: 'title' }, { status: 400 });
    if (qBody.length < 50) return NextResponse.json({ ok: false, error: 'VALIDATION', field: 'body' }, { status: 400 });

    // ✅ валидация платного вопроса
    if (!isFree) {
      if (priceRub < 600) {
        return NextResponse.json({ ok: false, error: 'VALIDATION', field: 'priceRub', hint: 'MIN_600' }, { status: 400 });
      }
    }

    if (assignedDoctorId) {
      const doc = await prisma.doctor.findUnique({ where: { id: assignedDoctorId }, select: { status: true } });
      if (!doc || doc.status !== 'APPROVED') {
        return NextResponse.json({ ok: false, error: 'BAD_DOCTOR' }, { status: 400 });
      }
    }

    const created = await prisma.question.create({
      data: {
        authorTelegramId: v.user.id,
        authorUsername: v.user.username,
        authorFirstName: v.user.first_name,
        authorLastName: v.user.last_name,

        authorIsAnonymous,

        speciality,
        title,
        body: qBody,
        keywords,

        isFree,
        priceRub: isFree ? 0 : priceRub,

        assignedDoctorId,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, id: created.id, createdAt: created.createdAt });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED_TO_CREATE' }, { status: 500 });
  }
}

export const GET = POST;
