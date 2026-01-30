/* path: app/api/answer/comment/create/route.ts */
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

function cleanText(v: any, maxLen: number) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen).trimEnd();
}

function doctorLastFirst(d: any) {
  const ln = String(d?.lastName || '').trim();
  const fn = String(d?.firstName || '').trim();
  const full = [ln, fn].filter(Boolean).join(' ').trim();
  return full || '—';
}

export async function POST(req: Request) {
  try {
    const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    if (!botToken) return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
    }

    const initData = typeof (body as any).initData === 'string' ? String((body as any).initData).trim() : '';
    if (!initData) return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });

    const v = verifyTelegramWebAppInitData(initData, botToken);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 401 });

    const answerId = cleanText((body as any).answerId, 200);
    const commentBody = cleanText((body as any).body, 4000);

    if (!answerId) return NextResponse.json({ ok: false, error: 'VALIDATION', field: 'answerId' }, { status: 400 });
    if (commentBody.length < 1) return NextResponse.json({ ok: false, error: 'VALIDATION', field: 'body' }, { status: 400 });

    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      select: {
        id: true,
        doctorId: true,
        question: { select: { authorTelegramId: true } },
      },
    });

    if (!answer) return NextResponse.json({ ok: false, error: 'NO_ANSWER' }, { status: 404 });

    const telegramId = v.user.id;

    const doctor = await prisma.doctor.findUnique({
      where: { telegramId },
      select: { id: true, status: true, lastName: true, firstName: true },
    });

    const isApprovedDoctor = !!doctor && doctor.status === DoctorStatus.APPROVED;

    const isAnswerDoctor = isApprovedDoctor && doctor?.id === answer.doctorId;
    const isQuestionAuthor = answer.question.authorTelegramId === telegramId;

    if (!isAnswerDoctor && !isQuestionAuthor) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    }

    const created = await prisma.answerComment.create({
      data: {
        answerId: answer.id,
        authorType: isAnswerDoctor ? 'DOCTOR' : 'USER',
        authorDoctorId: isAnswerDoctor ? doctor!.id : null,
        authorTelegramId: isQuestionAuthor ? telegramId : null,
        body: commentBody,
      },
      select: {
        id: true,
        createdAt: true,
        authorType: true,
        body: true,
        authorDoctor: { select: { lastName: true, firstName: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      id: created.id,
      createdAt: created.createdAt.toISOString(),
      authorType: created.authorType,
      authorDoctorName: created.authorDoctor ? doctorLastFirst(created.authorDoctor) : null,
      body: created.body,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED_TO_CREATE_COMMENT' }, { status: 500 });
  }
}

export const GET = POST;
