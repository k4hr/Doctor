/* path: app/api/doctor/reviews/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyInitData, getInitDataFrom, getTelegramIdStrict } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN =
  process.env.BOT_TOKEN ||
  process.env.TG_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  '';

function norm(s: any) {
  return String(s ?? '').trim();
}

function safeInt(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n);
}

function calcAvg(sum: number, count: number) {
  if (!count || count <= 0) return 0;
  return sum / count;
}

function round1(x: number) {
  return Math.round(x * 10) / 10;
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

    // любой валидный пользователь
    getTelegramIdStrict(initData);

    const url = new URL(req.url);
    const doctorIdQ = norm(url.searchParams.get('doctorId'));
    const limitQ = safeInt(url.searchParams.get('limit'));
    const limit = limitQ > 0 ? Math.min(limitQ, 50) : 50;

    let doctorId = doctorIdQ;

    // если doctorId не передали — пробуем "моего" врача по telegramId
    if (!doctorId) {
      const telegramId = getTelegramIdStrict(initData);
      const me = await prisma.doctor.findUnique({
        where: { telegramId },
        select: { id: true },
      });
      doctorId = me?.id ? String(me.id) : '';
    }

    if (!doctorId) {
      return NextResponse.json({ ok: true, doctorId: null, rating: { value: 0, count: 0 }, items: [] });
    }

    // агрегаты
    const docAgg = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { ratingSum: true, ratingCount: true },
    });

    const ratingSum = Number(docAgg?.ratingSum ?? 0);
    const ratingCount = Number(docAgg?.ratingCount ?? 0);
    const avg = round1(calcAvg(ratingSum, ratingCount));

    const reviews = await prisma.doctorReview.findMany({
      where: { doctorId },
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        createdAt: true,
        rating: true,
        text: true,
        isVerified: true,
        isAnonymous: true,
      },
    });

    const items = reviews.map((r) => ({
      id: String(r.id),
      createdAt: r.createdAt.toISOString(),
      rating: Number(r.rating),
      text: r.text ? String(r.text) : null,
      isVerified: !!r.isVerified,
      isAnonymous: !!r.isAnonymous,
    }));

    return NextResponse.json({
      ok: true,
      doctorId,
      rating: { value: avg, count: ratingCount },
      items,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = (await req.json().catch(() => null)) as any;
    const doctorId = norm(body?.doctorId);
    const questionId = norm(body?.questionId);
    const rating = Math.max(1, Math.min(5, safeInt(body?.rating)));
    const text = body?.text === null ? null : norm(body?.text) || null;
    const isAnonymous = !!body?.isAnonymous;

    if (!doctorId || !questionId) {
      return NextResponse.json(
        { ok: false, error: 'BAD_INPUT', hint: 'doctorId и questionId обязательны' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: 'BAD_RATING', hint: 'Оценка должна быть 1..5' }, { status: 400 });
    }

    // 1) вопрос + автор
    const q = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true, authorTelegramId: true, status: true },
    });

    if (!q) {
      return NextResponse.json({ ok: false, error: 'QUESTION_NOT_FOUND' }, { status: 404 });
    }

    if (String(q.authorTelegramId) !== String(telegramId)) {
      return NextResponse.json(
        { ok: false, error: 'FORBIDDEN', hint: 'Отзыв может оставить только автор вопроса' },
        { status: 403 }
      );
    }

    // статус закрытия: DONE (по твоей enum)
    if (q.status !== 'DONE') {
      return NextResponse.json(
        { ok: false, error: 'QUESTION_NOT_CLOSED', hint: 'Отзыв можно оставить только после закрытия вопроса' },
        { status: 403 }
      );
    }

    // 2) вопрос действительно закрыт (есть QuestionClose) и врач выбран
    const qc = await prisma.questionClose.findUnique({
      where: { questionId },
      select: { selectedDoctorIds: true, authorTelegramId: true },
    });

    if (!qc) {
      return NextResponse.json(
        { ok: false, error: 'NOT_CLOSED', hint: 'Нет записи закрытия вопроса (QuestionClose)' },
        { status: 403 }
      );
    }

    if (String(qc.authorTelegramId) !== String(telegramId)) {
      return NextResponse.json(
        { ok: false, error: 'FORBIDDEN', hint: 'Закрытие вопроса принадлежит другому пользователю' },
        { status: 403 }
      );
    }

    const selectedDoctorIds = Array.isArray(qc.selectedDoctorIds) ? qc.selectedDoctorIds : [];

    if (!selectedDoctorIds.includes(doctorId)) {
      return NextResponse.json(
        { ok: false, error: 'DOCTOR_NOT_SELECTED', hint: 'Можно оставить отзыв только выбранным врачам' },
        { status: 403 }
      );
    }

    // 3) дубль (на всякий случай, даже если есть @@unique)
    const exists = await prisma.doctorReview.findFirst({
      where: {
        doctorId,
        questionId,
        authorTelegramId: telegramId,
      },
      select: { id: true },
    });

    if (exists) {
      return NextResponse.json(
        { ok: false, error: 'ALREADY_EXISTS', hint: 'Ты уже оставлял отзыв этому врачу по этому вопросу' },
        { status: 409 }
      );
    }

    // 4) транзакция: создать отзыв + обновить агрегаты
    const created = await prisma.$transaction(async (tx) => {
      const review = await tx.doctorReview.create({
        data: {
          doctorId,
          authorTelegramId: telegramId,
          isAnonymous,
          rating,
          text,
          questionId,
          answerId: null,
          isVerified: true,
        },
        select: { id: true },
      });

      await tx.doctor.update({
        where: { id: doctorId },
        data: {
          ratingSum: { increment: rating },
          ratingCount: { increment: 1 },
        },
      });

      return review;
    });

    return NextResponse.json({ ok: true, id: String(created.id) });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
