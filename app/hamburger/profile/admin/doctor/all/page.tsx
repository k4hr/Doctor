/* path: app/hamburger/profile/admin/doctor/all/page.tsx */
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import TopBarBack from '../../../../../../components/TopBarBack';
import { DoctorFileKind, DoctorStatus } from '@prisma/client';
import AdminDoctorAllClient from './AdminDoctorAllClient';

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

function envClean(name: string) {
  return String(process.env[name] ?? '').replace(/[\r\n]/g, '').trim();
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

export default async function DoctorAllPage() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  const initData = cookies().get('tg_init_data')?.value || '';

  const tgId = botToken && initData ? verifyAndExtractTelegramId(initData, botToken) : null;
  const okAdmin = tgId ? isAdmin(tgId) : false;

  if (!tgId || !okAdmin) {
    return (
      <main style={{ padding: 16 }}>
        <TopBarBack />
        <h1 style={{ marginTop: 8 }}>Доступ запрещён</h1>
        <p style={{ opacity: 0.7 }}>Нужно открыть из Telegram и иметь права администратора.</p>
      </main>
    );
  }

  const doctors = await prisma.doctor.findMany({
    where: { status: DoctorStatus.APPROVED },
    orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }],
    take: 500,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      middleName: true,
      city: true,
      speciality1: true,
      speciality2: true,
      speciality3: true,
      experienceYears: true,

      ratingSum: true,
      ratingCount: true,

      // ✅ В ТВОЕЙ СХЕМЕ ЕСТЬ proUntil — вот его и берём (для золота).
      proUntil: true,

      files: {
        where: { kind: DoctorFileKind.PROFILE_PHOTO },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        take: 1,
        select: { url: true },
      },
    },
  });

  const items = doctors.map((d) => ({
    id: String(d.id),
    firstName: d.firstName ?? null,
    lastName: d.lastName ?? null,
    middleName: d.middleName ?? null,
    city: d.city ?? null,
    speciality1: d.speciality1 ?? null,
    speciality2: d.speciality2 ?? null,
    speciality3: d.speciality3 ?? null,
    experienceYears: typeof d.experienceYears === 'number' ? d.experienceYears : null,
    avatarUrl: toPublicUrlMaybe(d.files?.[0]?.url ?? null),

    ratingSum: typeof d.ratingSum === 'number' ? d.ratingSum : Number(d.ratingSum ?? 0),
    ratingCount: typeof d.ratingCount === 'number' ? d.ratingCount : Number(d.ratingCount ?? 0),

    // ✅ DoctorCard ждёт string ISO (или null)
    proUntil: d.proUntil ? new Date(d.proUntil).toISOString() : null,
  }));

  return (
    <main style={{ padding: 16 }}>
      <TopBarBack />
      <h1 style={{ marginTop: 8 }}>Одобренные врачи</h1>

      <p style={{ opacity: 0.7, marginTop: 6 }}>
        Нажми на врача — откроется карточка /admin/doctor/[id].
      </p>

      <AdminDoctorAllClient items={items} />
    </main>
  );
}
