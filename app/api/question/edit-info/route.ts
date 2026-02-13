/* path: app/api/question/edit-info/route.ts */
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

function verifyAndExtractTelegramId(initData: string, botToken: string): string | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');

    const dcs = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dcs).digest('hex');

    if (!timingSafeEqualHex(computedHash, hash)) return null;

    const userStr = params.get('user');
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    if (!user?.id) return null;

    return String(user.id);
  } catch {
    return null;
  }
}

function getTgIdFromCookies(): string | null {
  const botToken = envClean('TELEGRAM_BOT_TOKEN');
  const initData = cookies().get('tg_init_data')?.value || '';
  return botToken && initData ? verifyAndExtractTelegramId(initData, botToken) : null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = String(url.searchParams.get('id') || '').trim();
    if (!id) return NextResponse.json({ ok: false, error: 'Нет id' }, { status: 400 });

    const tgId = getTgIdFromCookies();
    if (!tgId) return NextResponse.json({ ok: false, error: 'Открой из Telegram.' }, { status: 401 });

    const q = await prisma.question.findUnique({
      where: { id },
      select: {
        id: true,
        authorTelegramId: true,
        speciality: true,
        title: true,
        body: true,
        keywords: true,
        editCount: true,
        close: { select: { id: true } },
        _count: { select: { answers: { where: { isDeleted: false } } } },
      },
    });

    if (!q) return NextResponse.json({ ok: false, error: 'Вопрос не найден.' }, { status: 404 });

    const isAuthor = String(q.authorTelegramId) === String(tgId);
    if (!isAuthor) return NextResponse.json({ ok: false, error: 'Только автор может редактировать.' }, { status: 403 });

    const editUsed = Number(q.editCount || 0) > 0;
    const isClosed = !!q.close;

    // ✅ правила редактирования:
    // - только автор
    // - только 1 раз (editCount===0)
    // - только пока вопрос не закрыт
    // - и чтобы не менять категорию задним числом: пока нет ответов
    const answersCount = Number(q?._count?.answers ?? 0);
    const canEdit = !isClosed && !editUsed && answersCount === 0;

    return NextResponse.json(
      {
        ok: true,
        questionId: String(q.id),
        canEdit,
        editUsed,
        isClosed,
        answersCount,
        speciality: String(q.speciality || ''),
        title: String(q.title || ''),
        body: String(q.body || ''),
        keywords: String(q.keywords || ''),
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: 'FAILED_EDIT_INFO', hint: String(e?.message || 'See server logs') },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}
