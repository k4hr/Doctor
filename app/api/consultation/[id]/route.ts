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
  const botToken = String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const initData = req.headers.get('X-Telegram-Init-Data') || req.headers.get('X-Init-Data') || '';
  if (!botToken || !initData) return null;
  return verifyAndExtractTelegramId(initData, botToken);
}

function doctorNameFrom(d: any) {
  const last = String(d?.lastName || '').trim();
  const first = String(d?.firstName || '').trim();
  const full = [last, first].filter(Boolean).join(' ').trim();
  return full || 'Врач';
}

export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const tgId = getTgIdFromHeaders(req);
    if (!tgId) return NextResponse.json({ ok: false, error: 'NO_INITDATA' }, { status: 401 });

    const id = String(ctx?.params?.id || '').trim();
    if (!id) return NextResponse.json({ ok: false, error: 'NO_ID' }, { status: 400 });

    const c = await prisma.consultation.findFirst({
      where: { id, authorTelegramId: String(tgId) },
      select: {
        id: true,
        status: true,
        createdAt: true,
        priceRub: true,
        paidAt: true,
        body: true,
        doctorId: true,
        doctor: { select: { firstName: true, lastName: true } },
        files: {
          where: { kind: 'PHOTO' },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { url: true },
        },
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
          take: 300,
          select: { id: true, createdAt: true, authorType: true, body: true },
        },
      },
    });

    if (!c) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });

    const item = {
      id: String(c.id),
      status: String(c.status),
      createdAt: c.createdAt.toISOString(),
      priceRub: Number(c.priceRub || 0),
      paidAt: c.paidAt ? c.paidAt.toISOString() : null,
      doctorId: String(c.doctorId),
      doctorName: doctorNameFrom(c.doctor),
      problemText: String(c.body || ''),
      photos: (c.files || []).map((x) => String(x.url)).filter(Boolean),
      messages: (c.messages || []).map((m) => ({
        id: String(m.id),
        createdAt: m.createdAt.toISOString(),
        authorType: String(m.authorType) === 'DOCTOR' ? 'DOCTOR' : 'USER',
        body: String(m.body || ''),
      })),
    };

    return NextResponse.json({ ok: true, item }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED', hint: String(e?.message || 'See logs') }, { status: 500 });
  }
}
