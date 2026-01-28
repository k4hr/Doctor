/* path: app/api/admin/questions/delete/route.ts */
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

function isAdminTelegramId(tgId: string) {
  const raw =
    envClean('ADMIN_TELEGRAM_IDS') ||
    envClean('ADMIN_TG_IDS') ||
    envClean('ADMIN_IDS') ||
    '';
  const set = new Set(
    raw
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
  );
  return set.has(String(tgId));
}

export async function POST(req: Request) {
  try {
    const initData =
      req.headers.get('x-telegram-init-data') ||
      req.headers.get('x-init-data') ||
      '';

    const botToken = envClean('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 });
    }

    const tgId = initData ? verifyAndExtractTelegramId(initData, botToken) : null;
    if (!tgId || !isAdminTelegramId(tgId)) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({} as any));
    const id = body?.id ? String(body.id).trim() : '';
    if (!id) return NextResponse.json({ ok: false, error: 'NO_ID' }, { status: 400 });

    await prisma.question.delete({ where: { id } });

    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (e: any) {
    console.error(e);
    // если уже удалён
    if (String(e?.code || '') === 'P2025') {
      return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_DELETE', hint: String(e?.message || 'See server logs') },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}
