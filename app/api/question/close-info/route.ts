/* path: app/api/question/close-info/route.ts */
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DoctorFileKind } from '@prisma/client';

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

function toPublicUrlMaybe(value: string | null) {
  if (!value) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;

  const base = envClean('R2_PUBLIC_BASE_URL');
  if (!base) return v;

  return `${base.replace(/\/$/, '')}/${v}`;
}

function uniqByDoctor<T extends { doctorId: string }>(items: T[]): T[] {
  const m = new Map<string, T>();
  for (const it of items || []) {
    const k = String(it.doctorId || '').trim();
    if (!k) continue;
    if (!m.has(k)) m.set(k, it);
  }
  return Array.from(m.values());
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = String(url.searchParams.get('id') || '').trim();
    if (!id) return NextResponse.json({ ok: false, error: 'Нет id' }, { status: 400 });

    const botToken = envClean('TELEGRAM_BOT_TOKEN');
    const initData = cookies().get('tg_init_data')?.value || '';
    const tgId = botToken && initData ? verifyAndExtractTelegramId(initData, botToken) : null;

    if (!tgId) return NextResponse.json({ ok: false, error: 'Открой из Telegram.' }, { status: 401 });

    const q = await prisma.question.findUnique({
      where: { id },
      include: {
        close: true,
        answers: {
          where: { isDeleted: false },
          orderBy: [{ createdAt: 'asc' }],
          include: {
            doctor: {
              include: {
                files: {
                  where: { kind: DoctorFileKind.PROFILE_PHOTO },
                  orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                },
              },
            },
          },
        },
      },
    });

    if (!q) return NextResponse.json({ ok: false, error: 'Вопрос не найден.' }, { status: 404 });

    const isAuthor = String(q.authorTelegramId) === String(tgId);

    const rawDoctors = (q.answers || []).map((a: any) => {
      const d = a.doctor;

      const avatar =
        toPublicUrlMaybe(d?.files?.[0]?.url || null) ||
        toPublicUrlMaybe(d?.profilephotourl || null) ||
        null;

      return {
        doctorId: String(d.id),
        answerId: String(a.id),

        // ✅ прямо то, что нужно DoctorCard
        id: String(d.id),
        firstName: String(d?.firstName || '').trim() || '—',
        lastName: String(d?.lastName || '').trim() || '—',
        middleName: d?.middleName ? String(d.middleName) : null,
        city: d?.city ? String(d.city) : null,

        speciality1: String(d?.speciality1 || '').trim() || '—',
        speciality2: d?.speciality2 ? String(d.speciality2).trim() : null,
        speciality3: d?.speciality3 ? String(d.speciality3).trim() : null,

        experienceYears: typeof d?.experienceYears === 'number' ? d.experienceYears : null,
        avatarUrl: avatar,
      };
    });

    const doctors = uniqByDoctor(rawDoctors);

    return NextResponse.json({
      ok: true,
      questionId: String(q.id),
      isAuthor,
      status: String(q.status), // OPEN | IN_PROGRESS | DONE
      isFree: !!(q as any).isFree,
      priceRub: Number((q as any).priceRub || 0),
      doctors,
      closed: q.close
        ? {
            selectedDoctorIds: (q.close as any).selectedDoctorIds || [],
            totalRub: Number((q.close as any).totalRub || 0),
            perDoctorRub: Number((q.close as any).perDoctorRub || 0),
            status: String((q.close as any).status), // CREATED | PAID
            createdAt: (q.close as any).createdAt.toISOString(),
          }
        : null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}
