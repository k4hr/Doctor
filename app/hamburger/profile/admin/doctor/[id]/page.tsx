/* path: app/hamburger/profile/admin/doctor/[id]/page.tsx */
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import TopBarBack from '../../../../../../components/TopBarBack';

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

function parseMaybeJsonArray(value: string | null): string[] {
  if (!value) return [];
  const v = String(value).trim();
  if (!v) return [];
  if (v.startsWith('[')) {
    try {
      const arr = JSON.parse(v);
      if (Array.isArray(arr)) return arr.map((x) => String(x)).filter(Boolean);
    } catch {}
  }
  return [v];
}

export default async function DoctorAdminCardPage({ params }: { params: { id: string } }) {
  const { id } = params;

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

  const doctor = await prisma.doctor.findUnique({ where: { id } });

  if (!doctor) {
    return (
      <main style={{ padding: 16 }}>
        <TopBarBack />
        <h1 style={{ marginTop: 8 }}>Не найдено</h1>
        <p style={{ opacity: 0.7 }}>Анкета врача не найдена.</p>
      </main>
    );
  }

  const fullName = [doctor.lastName, doctor.firstName, doctor.middleName].filter(Boolean).join(' ');
  const tgName =
    [doctor.telegramFirstName, doctor.telegramLastName].filter(Boolean).join(' ') ||
    (doctor.telegramUsername ? `@${doctor.telegramUsername}` : '') ||
    doctor.telegramId;

  const profileUrls = parseMaybeJsonArray(doctor.profilePhotoUrl)
    .map((x) => toPublicUrlMaybe(x))
    .filter(Boolean) as string[];

  const docsUrls = parseMaybeJsonArray(doctor.diplomaPhotoUrl)
    .map((x) => toPublicUrlMaybe(x))
    .filter(Boolean) as string[];

  return (
    <main style={{ padding: 16 }}>
      <TopBarBack />
      <h1 style={{ marginTop: 8 }}>Анкета врача</h1>

      <div
        style={{
          marginTop: 10,
          padding: 12,
          borderRadius: 14,
          border: '1px solid #e5e7eb',
          background: '#fff',
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 16 }}>{fullName}</div>
        <div style={{ opacity: 0.7, marginTop: 4 }}>Telegram: {tgName}</div>
        <div style={{ marginTop: 6, fontWeight: 800 }}>
          Статус: <span style={{ color: '#111827' }}>{doctor.status}</span>
        </div>

        <div style={{ marginTop: 10, display: 'grid', gap: 8, fontSize: 13 }}>
          <div>
            <b>Специализация:</b> {doctor.speciality1}
            {doctor.speciality2 ? `, ${doctor.speciality2}` : ''}
            {doctor.speciality3 ? `, ${doctor.speciality3}` : ''}
          </div>
          <div>
            <b>Город:</b> {doctor.city || '—'}
          </div>
          <div>
            <b>Стаж:</b> {doctor.experienceYears} лет
          </div>
          <div>
            <b>Email:</b> {doctor.email}
          </div>
          <div>
            <b>SubmittedAt:</b> {doctor.submittedAt ? new Date(doctor.submittedAt).toLocaleString() : '—'}
          </div>
        </div>

        <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>
              Фото профиля {profileUrls.length ? <span style={{ opacity: 0.7 }}>({profileUrls.length})</span> : null}
            </div>

            {profileUrls.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {profileUrls.map((u) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={u}
                    src={u}
                    alt="profile"
                    style={{
                      width: '100%',
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 14,
                      border: '1px solid #e5e7eb',
                    }}
                  />
                ))}
              </div>
            ) : (
              <div style={{ opacity: 0.7 }}>Не загружено</div>
            )}
          </div>

          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>
              Документы {docsUrls.length ? <span style={{ opacity: 0.7 }}>({docsUrls.length})</span> : null}
            </div>

            {docsUrls.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {docsUrls.map((u) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={u}
                    src={u}
                    alt="doc"
                    style={{
                      width: '100%',
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 14,
                      border: '1px solid #e5e7eb',
                    }}
                  />
                ))}
              </div>
            ) : (
              <div style={{ opacity: 0.7 }}>Не загружено</div>
            )}
          </div>
        </div>

        <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

        <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
          <div>
            <b>Образование:</b>
            <br />
            {doctor.education}
          </div>
          <div>
            <b>О себе:</b>
            <br />
            {doctor.about}
          </div>
          <div>
            <b>Специализация подробно:</b>
            <br />
            {doctor.specialityDetails}
          </div>
          <div>
            <b>Опыт подробно:</b>
            <br />
            {doctor.experienceDetails}
          </div>
        </div>

        <p style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
          Дальше добавим кнопки: APPROVE / NEED_FIX / REJECT (через отдельные admin API).
        </p>
      </div>
    </main>
  );
}
