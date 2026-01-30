/* path: app/api/answer/create/route.ts */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { DoctorStatus } from '@prisma/client';

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

function norm(s: any) {
  return String(s ?? '').trim().toLowerCase();
}

function cleanText(v: any, maxLen: number) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen).trimEnd();
}

function isPrismaUnique(e: any) {
  return e?.code === 'P2002' || String(e?.message || '').includes('Unique constraint failed');
}

export async function POST(req: Request) {
  try {
    const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    if (!botToken) return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });

    const initData = cleanText((body as any).initData, 10000);
    const questionId = cleanText((body as any).questionId, 200);
    const answerBody = cleanText((body as any).body, 4000);

    if (!initData) return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });
    if (!questionId) return NextResponse.json({ ok: false, error: 'VALIDATION', field: 'questionId' }, { status: 400 });
    if (answerBody.length < 1) return NextResponse.json({ ok: false, error: 'VALIDATION', field: 'body' }, { status: 400 });

    const v = verifyTelegramWebAppInitData(initData, botToken);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 401 });

    const doctor = await prisma.doctor.findUnique({
      where: { telegramId: v.user.id },
      select: { id: true, status: true, speciality1: true, speciality2: true, speciality3: true },
    });

    if (!doctor || doctor.status !== DoctorStatus.APPROVED) {
      return NextResponse.json({ ok: false, error: 'NOT_APPROVED_DOCTOR' }, { status: 403 });
    }

    const q = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true, speciality: true },
    });

    if (!q) return NextResponse.json({ ok: false, error: 'NO_QUESTION' }, { status: 404 });

    const qSpec = norm(q.speciality);
    const docSpecs = new Set([doctor.speciality1, doctor.speciality2, doctor.speciality3].map(norm).filter(Boolean));

    if (!docSpecs.has(qSpec)) {
      return NextResponse.json({ ok: false, error: 'SPEC_MISMATCH' }, { status: 403 });
    }

    // лимит 10 "живых" ответов
    const cnt = await prisma.answer.count({ where: { questionId, isDeleted: false } });
    if (cnt >= 10) return NextResponse.json({ ok: false, error: 'ANSWER_LIMIT_REACHED' }, { status: 409 });

    const created = await prisma.answer.create({
      data: { questionId, doctorId: doctor.id, body: answerBody },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, id: created.id, createdAt: created.createdAt.toISOString() });
  } catch (e: any) {
    if (isPrismaUnique(e)) {
      return NextResponse.json({ ok: false, error: 'ALREADY_ANSWERED' }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED_TO_CREATE_ANSWER' }, { status: 500 });
  }
}
