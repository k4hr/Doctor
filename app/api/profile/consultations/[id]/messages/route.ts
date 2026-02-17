/* path: app/api/profile/consultations/[id]/messages/route.ts */
import crypto from 'crypto';
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

function getTgIdFromHeaders(req: Request): string | null {
  const botToken = envClean('TELEGRAM_BOT_TOKEN');
  const initData = req.headers.get('X-Telegram-Init-Data') || req.headers.get('X-Init-Data') || '';
  if (!botToken || !initData) return null;
  return verifyAndExtractTelegramId(initData, botToken);
}

function clampText(s: any, max = 2000) {
  const t = String(s ?? '').trim();
  if (!t) return '';
  return t.length <= max ? t : t.slice(0, max);
}

async function tgSendMessage(chatId: string, text: string) {
  const token = envClean('TELEGRAM_BOT_TOKEN');
  if (!token) return { ok: false, error: 'NO_BOT_TOKEN' as const };

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  const j = await res.json().catch(() => null);
  if (!res.ok || !j || j.ok !== true) {
    return { ok: false, error: 'TG_SEND_FAILED' as const, details: j };
  }
  return { ok: true };
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const tgId = getTgIdFromHeaders(req);
    if (!tgId) return NextResponse.json({ ok: false, error: 'NO_INITDATA' }, { status: 401 });

    const id = String(ctx?.params?.id || '').trim();
    if (!id) return NextResponse.json({ ok: false, error: 'NO_ID' }, { status: 400 });

    const bodyJson = await req.json().catch(() => ({} as any));
    const body = clampText(bodyJson?.body, 2000);
    if (!body) return NextResponse.json({ ok: false, error: 'EMPTY' }, { status: 400 });

    const c = await prisma.consultation.findFirst({
      where: { id, authorTelegramId: String(tgId) },
      select: {
        id: true,
        status: true,
        doctorId: true,
        doctor: { select: { telegramId: true, firstName: true, lastName: true } },
      },
    });
    if (!c) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });

    // Пока как и у врача: чат после принятия. Оплату добавим следующим шагом.
    if (String(c.status) !== 'ACCEPTED') {
      return NextResponse.json(
        { ok: false, error: 'CHAT_LOCKED', hint: 'Чат доступен только после принятия (и далее — после оплаты)' },
        { status: 409 }
      );
    }

    const m = await prisma.consultationMessage.create({
      data: {
        consultationId: c.id,
        authorType: 'USER',
        authorTelegramId: String(tgId),
        body,
      },
      select: { id: true },
    });

    // уведомляем врача в TG (мягко, без ссылок — просто “новое сообщение”)
    const doctorTg = String(c.doctor?.telegramId || '').trim();
    if (doctorTg) {
      const docName = [String(c.doctor?.lastName || '').trim(), String(c.doctor?.firstName || '').trim()]
        .filter(Boolean)
        .join(' ')
        .trim();
      const title = docName ? `👨‍⚕️ ${docName}` : '👨‍⚕️ Врач';

      await tgSendMessage(
        doctorTg,
        `💬 Новое сообщение в консультации.\n${title}\n\n"${body.length > 320 ? body.slice(0, 320) + '…' : body}"`
      );
    }

    return NextResponse.json({ ok: true, id: String(m.id) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: 'FAILED_SEND', hint: String(e?.message || 'See logs') },
      { status: 500 }
    );
  }
}
