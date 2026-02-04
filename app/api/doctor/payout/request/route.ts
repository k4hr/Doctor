/* path: app/api/doctor/payout/request/route.ts */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { DoctorStatus, DoctorTxStatus, DoctorTxType, DoctorPayoutStatus } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TgUser = { id: string };

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

function verifyTelegramWebAppInitData(initData: string, botToken: string, maxAgeSec = 60 * 60 * 24) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false as const, error: 'NO_HASH' as const };

  const authDateStr = params.get('auth_date');
  if (!authDateStr) return { ok: false as const, error: 'NO_AUTH_DATE' as const };

  const authDate = Number(authDateStr);
  if (!Number.isFinite(authDate)) return { ok: false as const, error: 'BAD_AUTH_DATE' as const };

  const nowSec = Math.floor(Date.now() / 1000);
  if (authDate > nowSec + 60) return { ok: false as const, error: 'AUTH_DATE_IN_FUTURE' as const };
  if (nowSec - authDate > maxAgeSec) return { ok: false as const, error: 'INITDATA_EXPIRED' as const };

  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (!timingSafeEqualHex(computedHash, hash)) return { ok: false as const, error: 'BAD_HASH' as const };

  const userStr = params.get('user');
  if (!userStr) return { ok: false as const, error: 'NO_USER' as const };

  let userJson: any;
  try {
    userJson = JSON.parse(userStr);
  } catch {
    return { ok: false as const, error: 'BAD_USER_JSON' as const };
  }

  if (!userJson?.id) return { ok: false as const, error: 'NO_USER_ID' as const };
  const user: TgUser = { id: String(userJson.id) };
  return { ok: true as const, user };
}

function cleanText(v: any, maxLen: number) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen).trimEnd();
}

function getInitDataFromHeaders(req: Request) {
  return cleanText(req.headers.get('x-telegram-init-data') || req.headers.get('x-init-data') || '', 10000);
}

export async function POST(req: Request) {
  try {
    const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    if (!botToken) return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 });

    const initData = getInitDataFromHeaders(req);
    if (!initData) return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });

    const v = verifyTelegramWebAppInitData(initData, botToken);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 401 });

    const body = await req.json().catch(() => null);
    const amountRub = Number(body?.amountRub || 0);

    if (!Number.isFinite(amountRub) || amountRub <= 0) {
      return NextResponse.json({ ok: false, error: 'BAD_AMOUNT' }, { status: 400 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { telegramId: v.user.id },
      select: { id: true, status: true },
    });

    if (!doctor || doctor.status !== DoctorStatus.APPROVED) {
      return NextResponse.json({ ok: false, error: 'NOT_APPROVED_DOCTOR' }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.doctorWallet.upsert({
        where: { doctorId: doctor.id },
        create: { doctorId: doctor.id, balanceRub: 0, pendingRub: 0 },
        update: {},
        select: { id: true, doctorId: true, balanceRub: true, pendingRub: true },
      });

      const amount = Math.floor(amountRub);

      if (amount > wallet.balanceRub) {
        return { ok: false as const, error: 'INSUFFICIENT_FUNDS' as const, balanceRub: wallet.balanceRub };
      }

      const payout = await tx.doctorPayoutRequest.create({
        data: {
          doctorId: doctor.id,
          amountRub: amount,
          status: DoctorPayoutStatus.PENDING,
          details: body?.details && typeof body.details === 'object' ? body.details : undefined,
        },
        select: { id: true, createdAt: true },
      });

      const trx = await tx.doctorTransaction.create({
        data: {
          doctorId: doctor.id,
          type: DoctorTxType.OUT,
          status: DoctorTxStatus.PENDING,
          amountRub: amount,
          title: 'Заявка на вывод',
          payoutId: payout.id,
        },
        select: { id: true },
      });

      await tx.doctorWallet.update({
        where: { doctorId: doctor.id },
        data: {
          balanceRub: { decrement: amount },
          pendingRub: { increment: amount },
        },
      });

      return { ok: true as const, payoutId: payout.id, transactionId: trx.id };
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, hint: `Баланс: ${result.balanceRub} ₽` },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true, payoutId: result.payoutId, transactionId: result.transactionId });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED', hint: String(e?.message || e) }, { status: 500 });
  }
}
