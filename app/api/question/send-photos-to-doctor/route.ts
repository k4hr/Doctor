/* path: app/api/question/send-photos-to-doctor/route.ts */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { DoctorStatus, QuestionStatus } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TgUser = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

function envClean(name: string) {
  return String(process.env[name] ?? '').replace(/[\r\n]/g, '').trim();
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
  return String(s ?? '').trim().toLowerCase();
}

async function tgSendPhoto(botToken: string, chatId: string, photoUrl: string, caption?: string) {
  const api = `https://api.telegram.org/bot${botToken}/sendPhoto`;
  const payload: any = { chat_id: chatId, photo: photoUrl };
  if (caption) payload.caption = caption;

  const res = await fetch(api, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const j = await res.json().catch(() => null);
  if (!res.ok || !j || j.ok !== true) {
    return { ok: false as const, status: res.status, tg: j };
  }
  return { ok: true as const };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: Request) {
  try {
    const botToken = envClean('TELEGRAM_BOT_TOKEN');
    if (!botToken) return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 });

    const body = await req.json().catch(() => ({} as any));
    const initData = typeof body?.initData === 'string' ? String(body.initData).trim() : '';
    const questionId = typeof body?.questionId === 'string' ? String(body.questionId).trim() : '';

    if (!initData) return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });
    if (!questionId) return NextResponse.json({ ok: false, error: 'NO_QUESTION_ID' }, { status: 400 });

    const v = verifyTelegramWebAppInitData(initData, botToken);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 401 });

    const tgId = String(v.user.id);

    // кто нажал — должен быть врачом APPROVED
    const doctor = await prisma.doctor.findUnique({
      where: { telegramId: tgId },
      select: {
        id: true,
        status: true,
        speciality1: true,
        speciality2: true,
        speciality3: true,
      },
    });

    if (!doctor || doctor.status !== DoctorStatus.APPROVED) {
      return NextResponse.json({ ok: false, error: 'NOT_APPROVED_DOCTOR' }, { status: 403 });
    }

    // вопрос + файлы + close + ответы
    const q = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        title: true,
        speciality: true,
        isFree: true,
        priceRub: true,
        status: true,
        assignedDoctorId: true,
        close: { select: { id: true } },
        files: {
          where: { kind: 'PHOTO' },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { url: true, sortOrder: true, createdAt: true },
        },
        answers: {
          where: { isDeleted: false },
          select: { doctorId: true },
        },
      },
    });

    if (!q) return NextResponse.json({ ok: false, error: 'NO_QUESTION' }, { status: 404 });

    // только платные
    const isPaid = q.isFree === false && Number(q.priceRub ?? 0) > 0;
    if (!isPaid) return NextResponse.json({ ok: false, error: 'QUESTION_NOT_PAID' }, { status: 400 });

    // если закрыт — не даём
    const isClosed = !!q.close || String(q.status) === String(QuestionStatus.DONE);
    if (isClosed) return NextResponse.json({ ok: false, error: 'QUESTION_CLOSED' }, { status: 400 });

    // доступ к вопросу: либо совпадает категория, либо назначен врачу
    const qSpec = norm(q.speciality);
    const docSpecs = new Set([doctor.speciality1, doctor.speciality2, doctor.speciality3].map(norm).filter(Boolean));

    const canByCategory = docSpecs.has(qSpec);
    const canByAssignment = q.assignedDoctorId ? String(q.assignedDoctorId) === String(doctor.id) : false;

    if (!canByCategory && !canByAssignment) {
      return NextResponse.json({ ok: false, error: 'SPEC_MISMATCH' }, { status: 403 });
    }

    // “может отвечать”: ещё не отвечал + лимит < 10
    const alreadyAnsweredByMe = q.answers.some((a) => String(a.doctorId) === String(doctor.id));
    if (alreadyAnsweredByMe) {
      return NextResponse.json({ ok: false, error: 'ALREADY_ANSWERED' }, { status: 400 });
    }
    if (q.answers.length >= 10) {
      return NextResponse.json({ ok: false, error: 'ANSWERS_LIMIT' }, { status: 400 });
    }

    const photos = Array.isArray(q.files) ? q.files : [];
    if (!photos.length) return NextResponse.json({ ok: false, error: 'NO_PHOTOS' }, { status: 400 });

    const urls = photos
      .map((f) => toPublicUrlMaybe(f.url))
      .filter(Boolean)
      .slice(0, 10) as string[];

    if (!urls.length) return NextResponse.json({ ok: false, error: 'NO_PUBLIC_PHOTOS' }, { status: 400 });

    // отправляем в чат врачу (его telegramId = chat_id)
    const captionBase = `Фото к платному вопросу: ${String(q.title || '').slice(0, 80)} (#${String(q.id).slice(0, 8)})`;

    for (let i = 0; i < urls.length; i++) {
      const cap = i === 0 ? captionBase : undefined;
      const r = await tgSendPhoto(botToken, tgId, urls[i], cap);
      if (!r.ok) {
        return NextResponse.json(
          { ok: false, error: 'TG_SEND_FAILED', index: i, status: r.status, details: r.tg },
          { status: 502 }
        );
      }
      await sleep(120);
    }

    return NextResponse.json({ ok: true, sent: urls.length });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED_SEND', hint: String(e?.message || 'See logs') }, { status: 500 });
  }
}

export const GET = POST;
