/* path: app/api/question/list/route.ts */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { QuestionStatus } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clampInt(n: any, def: number, min: number, max: number) {
  const x = Number(n);
  if (!Number.isFinite(x)) return def;
  return Math.max(min, Math.min(max, Math.floor(x)));
}

function snippet(s: string, max = 170) {
  const t = String(s || '').trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
}

function mapPriceToUi(q: any): 'FREE' | 'PAID' {
  const isFree = q?.isFree === true;
  const price = Number(q?.priceRub ?? q?.price ?? 0);
  return !isFree && Number.isFinite(price) && price > 0 ? 'PAID' : 'FREE';
}

function buildPriceText(q: any): string | undefined {
  const isFree = q?.isFree === true;
  const price = Number(q?.priceRub ?? q?.price ?? 0);
  if (isFree || !Number.isFinite(price) || price <= 0) return undefined;
  return `${Math.round(price)} ₽`;
}

function buildAuthorLabel(q: any) {
  const isAnon = q?.authorIsAnonymous !== false; // по умолчанию true
  if (isAnon) return 'Вопрос от Анонимно';

  const uname = String(q?.authorUsername || '').trim();
  if (uname) return `Вопрос от @${uname.replace(/^@/, '')}`;

  const fn = String(q?.authorFirstName || '').trim();
  const ln = String(q?.authorLastName || '').trim();
  const full = [fn, ln].filter(Boolean).join(' ').trim();
  if (full) return `Вопрос от ${full}`;

  return 'Вопрос от Пользователь';
}

function mapStatusToUi(statusDb: any, answersCount: number): 'WAITING' | 'ANSWERING' | 'CLOSED' {
  // ✅ CLOSED
  if (String(statusDb) === String(QuestionStatus.DONE) || String(statusDb) === 'DONE') return 'CLOSED';

  // ✅ если есть ответы — считаем что уже “ANSWERING”
  if (answersCount > 0) return 'ANSWERING';

  // ✅ иначе ждёт
  return 'WAITING';
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const limit = clampInt(body?.limit, 30, 1, 50);
    const cursor = body?.cursor ? String(body.cursor).trim() : '';

    const rows = await prisma.question.findMany({
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        speciality: true,
        status: true,

        // ✅ автор
        authorIsAnonymous: true,
        authorUsername: true,
        authorFirstName: true,
        authorLastName: true,

        // ✅ цена (если у тебя эти поля есть — оставь; если нет, просто удали их + mapPriceToUi/buildPriceText)
        isFree: true,
        priceRub: true,

        // ✅ СКОЛЬКО ОТВЕТОВ (только не удалённые)
        _count: {
          select: {
            answers: {
              where: { isDeleted: false },
            },
          },
        },
      },
    });

    const items = rows.map((q: any) => {
      const answersCount = Number(q?._count?.answers ?? 0);

      return {
        id: String(q.id),
        title: String(q.title),
        bodySnippet: snippet(String(q.body), 170),
        createdAt: q.createdAt.toISOString(),
        doctorLabel: String(q.speciality || '—'),
        authorLabel: buildAuthorLabel(q),

        // ✅ ВАЖНО: теперь карточка реально получит и статус, и answersCount
        answersCount,
        status: mapStatusToUi(q.status, answersCount),

        priceBadge: mapPriceToUi(q),
        priceText: buildPriceText(q),
      };
    });

    const nextCursor = rows.length ? String(rows[rows.length - 1].id) : null;

    return NextResponse.json(
      { ok: true, items, nextCursor },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_LIST', hint: String(e?.message || 'See server logs') },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

export const GET = POST;
