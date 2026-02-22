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
  if (String(statusDb) === String(QuestionStatus.DONE) || String(statusDb) === 'DONE') return 'CLOSED';
  if (answersCount > 0) return 'ANSWERING';
  return 'WAITING';
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    // ✅ новый режим: page + pageSize (реальная пагинация)
    const page = clampInt(body?.page, 1, 1, 1_000_000); // 1-based
    const pageSize = clampInt(body?.pageSize ?? body?.limit, 10, 1, 50);

    // ✅ старый режим: cursor (оставляем совместимость)
    const cursor = body?.cursor ? String(body.cursor).trim() : '';
    const useCursor = !!cursor && !body?.page; // если page задан — работаем по page/skip

    // тут можно добавить фильтры (например, только не удалённые/только опубликованные)
    const where: any = {};

    // totalCount — реальное число записей для реальных страниц
    const totalCount = await prisma.question.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const select = {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      speciality: true,
      status: true,

      authorIsAnonymous: true,
      authorUsername: true,
      authorFirstName: true,
      authorLastName: true,

      isFree: true,
      priceRub: true,

      _count: {
        select: {
          answers: {
            where: { isDeleted: false },
          },
        },
      },
    } as const;

    let rows: any[] = [];

    if (useCursor) {
      rows = await prisma.question.findMany({
        where,
        take: pageSize,
        skip: 1,
        cursor: { id: cursor },
        orderBy: { createdAt: 'desc' },
        select,
      });
    } else {
      const safePage = Math.max(1, Math.min(totalPages, page));
      const skip = (safePage - 1) * pageSize;

      rows = await prisma.question.findMany({
        where,
        take: pageSize,
        skip,
        orderBy: { createdAt: 'desc' },
        select,
      });
    }

    const items = rows.map((q: any) => {
      const answersCount = Number(q?._count?.answers ?? 0);

      return {
        id: String(q.id),
        title: String(q.title),
        bodySnippet: snippet(String(q.body), 170),
        createdAt: q.createdAt.toISOString(),
        doctorLabel: String(q.speciality || '—'),
        authorLabel: buildAuthorLabel(q),

        answersCount,
        status: mapStatusToUi(q.status, answersCount),

        priceBadge: mapPriceToUi(q),
        priceText: buildPriceText(q),
      };
    });

    const nextCursor = rows.length ? String(rows[rows.length - 1].id) : null;

    return NextResponse.json(
      {
        ok: true,
        items,
        nextCursor, // совместимость
        totalCount,
        totalPages,
        pageSize,
      },
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
