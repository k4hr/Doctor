/* path: app/api/admin/questions/get/route.ts */
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
  const raw = envClean('ADMIN_TELEGRAM_IDS') || envClean('ADMIN_TG_IDS') || envClean('ADMIN_IDS') || '';
  const set = new Set(
    raw
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
  );
  return set.has(String(tgId));
}

function toPublicUrlMaybe(value: string | null) {
  if (!value) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;

  const base = envClean('R2_PUBLIC_BASE_URL');
  if (!base) return v;

  return `${base.replace(/\/$/, '')}/${v}`;
}

export async function POST(req: Request) {
  try {
    const initData = req.headers.get('x-telegram-init-data') || req.headers.get('x-init-data') || '';
    const botToken = envClean('TELEGRAM_BOT_TOKEN');
    if (!botToken) return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 });

    const tgId = initData ? verifyAndExtractTelegramId(initData, botToken) : null;
    if (!tgId || !isAdminTelegramId(tgId)) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({} as any));
    const id = body?.id ? String(body.id).trim() : '';
    if (!id) return NextResponse.json({ ok: false, error: 'NO_ID' }, { status: 400 });

    const q = await prisma.question.findUnique({
      where: { id },
      include: {
        files: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    });

    if (!q) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });

    const photoUrls = q.files
      .filter((f) => String(f.kind) === 'PHOTO')
      .map((f) => toPublicUrlMaybe(f.url))
      .filter(Boolean) as string[];

    return NextResponse.json(
      {
        ok: true,
        item: {
          id: String(q.id),
          createdAt: q.createdAt.toISOString(),
          updatedAt: q.updatedAt.toISOString(),
          status: String(q.status),
          speciality: String(q.speciality),
          title: String(q.title),
          body: String(q.body),
          keywords: Array.isArray(q.keywords) ? q.keywords.map(String) : [],
          authorTelegramId: String(q.authorTelegramId),
          authorUsername: q.authorUsername ? String(q.authorUsername) : null,
          authorFirstName: q.authorFirstName ? String(q.authorFirstName) : null,
          authorLastName: q.authorLastName ? String(q.authorLastName) : null,
          assignedDoctorId: q.assignedDoctorId ? String(q.assignedDoctorId) : null,
          answeredByDoctorId: q.answeredByDoctorId ? String(q.answeredByDoctorId) : null,
          photoUrls,
        },
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_GET', hint: String(e?.message || 'See server logs') },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

export const GET = POST;
