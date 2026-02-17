/* path: app/api/profile/consultations/route.ts */
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

function doctorNameFrom(d: any) {
  const last = String(d?.lastName || '').trim();
  const first = String(d?.firstName || '').trim();
  const full = [last, first].filter(Boolean).join(' ').trim();
  return full || 'Врач';
}

function clampText(s: any, max = 140) {
  const t = String(s ?? '').trim();
  if (!t) return '';
  return t.length <= max ? t : t.slice(0, max);
}

export async function GET(req: Request) {
  try {
    const tgId = getTgIdFromHeaders(req);
    if (!tgId) return NextResponse.json({ ok: false, error: 'NO_INITDATA' }, { status: 401 });

    const list = await prisma.consultation.findMany({
      where: { authorTelegramId: String(tgId) },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        status: true,
        createdAt: true,
        priceRub: true,

        doctorId: true,
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilephotourl: true,
          },
        },

        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true, authorType: true },
        },
      },
    });

    const items = (list || []).map((c) => {
      const d = c.doctor || null;
      const lastMsg = (c.messages || [])[0] || null;
      const lastText = lastMsg ? clampText(lastMsg.body, 160) : null;

      return {
        id: String(c.id),
        status: String(c.status),
        createdAt: c.createdAt.toISOString(),
        priceRub: Number(c.priceRub || 0),

        doctorId: String(c.doctorId),
        doctorName: doctorNameFrom(d),
        doctorPhotoUrl: d?.profilephotourl ? String(d.profilephotourl) : null,

        lastText,
      };
    });

    return NextResponse.json({ ok: true, items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: 'FAILED_LIST', hint: String(e?.message || 'See logs') },
      { status: 500 }
    );
  }
}
