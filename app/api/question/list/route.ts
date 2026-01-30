/* path: app/api/question/list/route.ts */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

function mapStatusToUi(status: any): 'ANSWERING' | 'WAITING' {
  // UI: только 2 статуса
  return String(status) === 'IN_PROGRESS' ? 'ANSWERING' : 'WAITING';
}

function mapPriceToUi(_q: any): 'FREE' | 'PAID' {
  // пока цены не сделали — всегда FREE
  return 'FREE';
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

        authorIsAnonymous: true,
        authorUsername: true,
        authorFirstName: true,
        authorLastName: true,
      },
    });

    const items = rows.map((q) => ({
      id: String(q.id),
      title: String(q.title),
      bodySnippet: snippet(String(q.body), 170),
      createdAt: q.createdAt.toISOString(),
      doctorLabel: String(q.speciality || '—'),
      authorLabel: buildAuthorLabel(q), // ✅ новое
      status: mapStatusToUi(q.status),
      priceBadge: mapPriceToUi(q),
    }));

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
