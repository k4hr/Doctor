import crypto from 'crypto';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import TopBarBack from '../../../../../../components/TopBarBack';
import { DoctorFileKind, DoctorStatus } from '@prisma/client';

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

function toPublicUrlMaybe(value: string | null) {
  if (!value) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;

  const base = (process.env.R2_PUBLIC_BASE_URL || '').trim();
  if (!base) return v;
  return `${base.replace(/\/$/, '')}/${v}`;
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
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
      submittedAt: true,
      updatedAt: true,
      files: {
        where: { kind: DoctorFileKind.PROFILE_PHOTO },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        take: 1,
        select: { url: true },
      },
    },
  });

  return (
    <main style={{ padding: 16 }}>
      <TopBarBack />
      <h1 style={{ marginTop: 8 }}>Одобренные врачи</h1>

      <p style={{ opacity: 0.7, marginTop: 6 }}>
        Нажми на врача — откроется карточка /admin/doctor/[id]. Позже сюда добавим рейтинг, баланс, ответы, онлайн.
      </p>

      <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
        {doctors.length === 0 ? (
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              border: '1px solid #e5e7eb',
              background: '#fff',
              opacity: 0.8,
            }}
          >
            Пока нет одобренных анкет.
          </div>
        ) : (
          doctors.map((d) => {
            const fullName = [d.lastName, d.firstName, d.middleName].filter(Boolean).join(' ');
            const avatar = toPublicUrlMaybe(d.files?.[0]?.url || null);

            return (
              <Link
                key={d.id}
                href={`/hamburger/profile/admin/doctor/${encodeURIComponent(d.id)}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    display: 'grid',
                    gridTemplateColumns: '52px 1fr',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      overflow: 'hidden',
                      border: '1px solid #e5e7eb',
                      background: '#f3f4f6',
                    }}
                  >
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt="avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : null}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, color: '#111827', fontSize: 14, lineHeight: 1.2 }}>
                      {fullName || '—'}
                    </div>

                    <div style={{ marginTop: 4, fontSize: 12, color: '#374151' }}>
                      {d.speciality1}
                      {d.speciality2 ? `, ${d.speciality2}` : ''}
                      {d.speciality3 ? `, ${d.speciality3}` : ''}
                      {d.city ? ` • ${d.city}` : ''}
                      {Number.isFinite(d.experienceYears) ? ` • стаж ${d.experienceYears} лет` : ''}
                    </div>

                    <div style={{ marginTop: 6, fontSize: 11, color: '#6b7280' }}>
                      Одобрено: {fmtDate(d.submittedAt)} • Обновлено: {fmtDate(d.updatedAt)}
                    </div>

                    {/* заглушки под будущие метрики */}
                    <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>
                      Рейтинг: — • Баланс: — • Ответов: — • Онлайн: —
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
