/* path: app/api/consultation/submit/route.ts */
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
  if (!botToken || !initData) return null;
  return verifyAndExtractTelegramId(initData, botToken);
}

export async function POST(req: Request) {
  try {
    const tgId = getTgIdFromCookies();
    if (!tgId) return NextResponse.json({ ok: false, error: 'Открой из Telegram.' }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    const consultationId = String(body?.consultationId ?? '').trim();
    if (!consultationId) return NextResponse.json({ ok: false, error: 'NO_ID' }, { status: 400 });

    const c = await prisma.consultation.findUnique({
      where: { id: consultationId },
      select: { id: true, authorTelegramId: true, status: true },
    });

    if (!c) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
    if (String(c.authorTelegramId) !== String(tgId)) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    if (String(c.status) !== 'DRAFT') return NextResponse.json({ ok: false, error: 'BAD_STATUS' }, { status: 409 });

    await prisma.consultation.update({
      where: { id: consultationId },
      data: { status: 'PENDING' },
    });

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED_SUBMIT', hint: String(e?.message || 'See logs') }, { status: 500 });
  }
}
