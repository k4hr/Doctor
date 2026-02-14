/* path: app/api/consultation/create/route.ts */
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

function clampText(s: any, max = 4000) {
  const t = String(s ?? '').trim();
  if (t.length <= max) return t;
  return t.slice(0, max);
}

export async function POST(req: Request) {
  try {
    const tgId = getTgIdFromCookies();
    if (!tgId) return NextResponse.json({ ok: false, error: 'Открой из Telegram.' }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    const doctorId = String(body?.doctorId ?? '').trim();
    const problemText = clampText(body?.problemText, 4000);

    if (!doctorId) return NextResponse.json({ ok: false, error: 'NO_DOCTOR' }, { status: 400 });
    if (problemText.length < 10) return NextResponse.json({ ok: false, error: 'TOO_SHORT' }, { status: 400 });

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, consultationEnabled: true, consultationPriceRub: true },
    });

    if (!doctor) return NextResponse.json({ ok: false, error: 'DOCTOR_NOT_FOUND' }, { status: 404 });
    if (!doctor.consultationEnabled) return NextResponse.json({ ok: false, error: 'CONSULTATIONS_DISABLED' }, { status: 403 });

    const price = Math.max(0, Math.round(Number(doctor.consultationPriceRub ?? 1000)));

    const c = await prisma.consultation.create({
      data: {
        doctorId: doctor.id,
        authorTelegramId: String(tgId),
        authorIsAnonymous: true,
        body: problemText,
        priceRub: price,
        status: 'DRAFT',
      },
      select: { id: true, priceRub: true },
    });

    return NextResponse.json({ ok: true, consultationId: c.id, priceRub: c.priceRub }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'FAILED_CREATE', hint: String(e?.message || 'See logs') }, { status: 500 });
  }
}
