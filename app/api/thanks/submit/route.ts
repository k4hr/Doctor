/* path: app/api/thanks/submit/route.ts */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
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

export async function POST(req: Request) {
  try {
    const botToken = envClean('TELEGRAM_BOT_TOKEN');
    if (!botToken) return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
    }

    const initData = typeof (body as any).initData === 'string' ? String((body as any).initData).trim() : '';
    if (!initData) return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });

    const tgId = verifyAndExtractTelegramId(initData, botToken);
    if (!tgId) return NextResponse.json({ ok: false, error: 'BAD_INITDATA' }, { status: 401 });

    const thanksId = String((body as any).thanksId ?? '').trim();
    if (!thanksId) return NextResponse.json({ ok: false, error: 'NO_THANKS_ID' }, { status: 400 });

    const t = await prisma.thanks.findUnique({
      where: { id: thanksId },
      select: { id: true, authorTelegramId: true, status: true },
    });

    if (!t) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
    if (String(t.authorTelegramId) !== String(tgId)) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    if (String(t.status) !== 'DRAFT') return NextResponse.json({ ok: false, error: 'BAD_STATUS' }, { status: 409 });

    await prisma.thanks.update({
      where: { id: thanksId },
      data: { status: 'PENDING' },
    });

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED_SUBMIT', hint: String(e?.message || '') }, { status: 500 });
  }
}

export const GET = POST;
