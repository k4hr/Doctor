import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { DoctorStatus } from '@prisma/client';

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

function isValidStatus(v: any): v is DoctorStatus {
  return (
    v === DoctorStatus.DRAFT ||
    v === DoctorStatus.PENDING ||
    v === DoctorStatus.NEED_FIX ||
    v === DoctorStatus.APPROVED ||
    v === DoctorStatus.REJECTED
  );
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;

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
    const nextStatus = body?.status;

    if (!isValidStatus(nextStatus)) {
      return NextResponse.json(
        { ok: false, error: 'BAD_STATUS', hint: 'status должен быть DoctorStatus' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Логика submittedAt:
    // - если ставим PENDING и его ещё не было — поставим now
    // - если ставим APPROVED и submittedAt пустой — тоже поставим now (на всякий)
    const data: any = { status: nextStatus };
    if ((nextStatus === DoctorStatus.PENDING || nextStatus === DoctorStatus.APPROVED)) {
      data.submittedAt = { set: now }; // ниже мы переопределим аккуратно через findFirst, чтобы не ломать существующее
    }

    const doctor = await prisma.doctor.findUnique({ where: { id }, select: { submittedAt: true } });
    if (!doctor) {
      return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
    }

    if (nextStatus === DoctorStatus.PENDING || nextStatus === DoctorStatus.APPROVED) {
      if (doctor.submittedAt) {
        delete data.submittedAt; // не трогаем, если уже есть
      }
    }

    const updated = await prisma.doctor.update({
      where: { id },
      data,
      select: { id: true, status: true, submittedAt: true },
    });

    return NextResponse.json({ ok: true, id: updated.id, status: updated.status, submittedAt: updated.submittedAt });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED_TO_UPDATE_STATUS' }, { status: 500 });
  }
}
