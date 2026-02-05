import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DoctorStatus, QuestionStatus } from '@prisma/client';
import { verifyInitData, getInitDataFrom, getTelegramIdStrict } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN =
  process.env.BOT_TOKEN ||
  process.env.TG_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  '';

type Item = {
  questionId: string;
  questionTitle: string | null;
  questionSpeciality: string | null;
  questionStatus: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  questionCreatedAt: string;
  questionUpdatedAt: string;
  lastAnswerId: string;
  lastAnswerCreatedAt: string;
  lastAnswerBody: string;
};

function clampInt(v: any, def = 50, min = 1, max = 500) {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function cleanText(v: any, maxLen: number) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen).trimEnd();
}

function pickScope(q: URLSearchParams) {
  const s = String(q.get('scope') || 'active').trim().toLowerCase();
  return s === 'archive' ? 'archive' : 'active';
}

function statusLabelAllowed(scope: 'active' | 'archive') {
  if (scope === 'archive') return [QuestionStatus.DONE];
  return [QuestionStatus.OPEN, QuestionStatus.IN_PROGRESS];
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
      select: { id: true, status: true },
    });

    if (!doctor || doctor.status !== DoctorStatus.APPROVED) {
      return NextResponse.json({ ok: false, error: 'NOT_APPROVED_DOCTOR' }, { status: 403 });
    }

    const url = new URL(req.url);
    const scope = pickScope(url.searchParams);
    const limit = clampInt(url.searchParams.get('limit'), 200, 1, 500);

    const allowedStatuses = statusLabelAllowed(scope);

    // Берём ответы врача + вопрос, потом дедуп по questionId (берём самый свежий ответ)
    const answers = await prisma.answer.findMany({
      where: {
        doctorId: doctor.id,
        isDeleted: false,
        question: { status: { in: allowedStatuses } },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: limit * 3, // запас для дедупа
      select: {
        id: true,
        createdAt: true,
        body: true,
        questionId: true,
        question: {
          select: {
            id: true,
            title: true,
            speciality: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const map = new Map<string, Item>();

    for (const a of answers) {
      const q = a.question;
      if (!q) continue;

      const qid = String(a.questionId);
      if (map.has(qid)) continue; // уже есть (самый свежий ответ сверху)

      map.set(qid, {
        questionId: String(q.id),
        questionTitle: q.title ? String(q.title) : null,
        questionSpeciality: q.speciality ? String(q.speciality) : null,
        questionStatus: q.status as any,
        questionCreatedAt: q.createdAt.toISOString(),
        questionUpdatedAt: q.updatedAt.toISOString(),
        lastAnswerId: String(a.id),
        lastAnswerCreatedAt: a.createdAt.toISOString(),
        lastAnswerBody: cleanText(a.body, 800),
      });

      if (map.size >= limit) break;
    }

    const items = Array.from(map.values());

    return NextResponse.json({
      ok: true,
      doctorId: String(doctor.id),
      scope,
      items,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
