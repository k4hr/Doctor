/* path: app/api/pro/create/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyInitData, getInitDataFrom, getTelegramIdStrict } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN =
  process.env.BOT_TOKEN ||
  process.env.TG_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  '';

type Plan = 'M1' | 'M3' | 'M6' | 'Y1';

const PLAN_META: Record<Plan, { months: number; priceRub: number }> = {
  M1: { months: 1, priceRub: 199 },
  M3: { months: 3, priceRub: 499 },
  M6: { months: 6, priceRub: 899 },
  Y1: { months: 12, priceRub: 1499 },
};

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);

  // защита от "перепрыгивания" месяца (например, 31-е)
  if (d.getDate() < day) d.setDate(0);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    const initData = await getInitDataFrom(req);

    if (!initData) {
      return NextResponse.json(
        { ok: false, error: 'NO_INIT_DATA', hint: 'Открой из Telegram WebApp (initData обязателен).' },
        { status: 401 }
      );
    }

    if (!BOT_TOKEN) {
      return NextResponse.json(
        { ok: false, error: 'BOT_TOKEN_MISSING', hint: 'Set BOT_TOKEN/TG_BOT_TOKEN/TELEGRAM_BOT_TOKEN in env' },
        { status: 500 }
      );
    }

    if (!verifyInitData(initData, BOT_TOKEN)) {
      return NextResponse.json({ ok: false, error: 'BAD_INITDATA' }, { status: 401 });
    }

    const telegramId = getTelegramIdStrict(initData);

    const body = await req.json().catch(() => ({} as any));
    const plan = body?.plan as Plan;

    if (!plan || !(plan in PLAN_META)) {
      return NextResponse.json({ ok: false, error: 'BAD_PLAN' }, { status: 400 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { telegramId },
      select: { id: true, proUntil: true },
    });

    if (!doctor) {
      return NextResponse.json({ ok: false, error: 'NOT_DOCTOR' }, { status: 403 });
    }

    const now = new Date();
    const { months, priceRub } = PLAN_META[plan];

    // ✅ если PRO уже есть и ещё не истёк — продлеваем от текущего proUntil, иначе от now
    const baseStart = doctor.proUntil && new Date(doctor.proUntil).getTime() > now.getTime()
      ? new Date(doctor.proUntil)
      : now;

    const startsAt = now; // момент покупки/активации (лог)
    const endsAt = addMonths(baseStart, months);

    // ✅ создаём запись подписки (пока без реального платежа — считаем активной)
    const sub = await prisma.doctorProSubscription.create({
      data: {
        doctorId: doctor.id,
        plan,
        status: 'ACTIVE',
        startsAt,
        endsAt,
        priceRub,
        provider: 'stub',
        paymentId: `stub_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        meta: {
          note: 'stub payment - replace with real provider later',
          telegramId,
          plan,
          priceRub,
          months,
        },
      },
      select: { id: true, endsAt: true, status: true, plan: true },
    });

    // ✅ обновляем быстрый срез в Doctor
    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { proUntil: sub.endsAt },
    });

    // Заглушка на "успешную оплату" (потом будет ссылка провайдера)
    const payUrl = `/vrach/pro/success?subId=${encodeURIComponent(sub.id)}`;

    return NextResponse.json({
      ok: true,
      subId: sub.id,
      plan: sub.plan,
      status: sub.status,
      proUntil: sub.endsAt,
      payUrl,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
