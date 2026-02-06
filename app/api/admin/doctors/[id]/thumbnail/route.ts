/* path: app/api/admin/doctors/[id]/thumbnail/route.ts */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

function isAdmin(telegramId: string) {
  const raw = (process.env.ADMIN_TG_IDS || '').trim();
  if (!raw) return false;
  const set = new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  return set.has(String(telegramId));
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const id = String(ctx.params.id || '').trim();
    if (!id) {
      return NextResponse.json({ ok: false, error: 'NO_ID' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!botToken) {
      return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 });
    }

    const initData = cookies().get('tg_init_data')?.value || '';
    if (!initData) {
      return NextResponse.json(
        { ok: false, error: 'NO_INIT_DATA', hint: 'Открой админку из Telegram WebApp' },
        { status: 401 }
      );
    }

    const tgId = verifyAndExtractTelegramId(initData, botToken);
    if (!tgId || !isAdmin(tgId)) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const xRaw = body?.x;
    const yRaw = body?.y;

    const xNum = Number(xRaw);
    const yNum = Number(yRaw);

    if (!Number.isFinite(xNum) || !Number.isFinite(yNum)) {
      return NextResponse.json(
        { ok: false, error: 'VALIDATION', field: 'x/y', hint: 'x и y должны быть числами (проценты 0..100)' },
        { status: 400 }
      );
    }

    const crop = { x: clamp(xNum, 0, 100), y: clamp(yNum, 0, 100) };

    const updated = await prisma.doctor.update({
      where: { id },
      data: { profilephotocrop: crop as any },
      select: { id: true, profilephotocrop: true },
    });

    return NextResponse.json({ ok: true, id: updated.id, crop: updated.profilephotocrop });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED', hint: String(e?.message || 'See logs') }, { status: 500 });
  }
}
