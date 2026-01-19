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
      .map(s => s.trim())
      .filter(Boolean)
  );
  return set.has(String(telegramId));
}

export default async function DoctorAdminCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const doctor = await prisma.doctor.findUnique({
    where: { id },
  });

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

  return (
    <main style={{ padding: 16 }}>
      <TopBarBack />
      <h1 style={{ marginTop: 8 }}>Анкета врача</h1>

      <div style={{ marginTop: 10, padding: 12, borderRadius: 14, border: '1px solid #e5e7eb', background: '#fff' }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>{fullName}</div>
        <div style={{ opacity: 0.7, marginTop: 4 }}>Telegram: {tgName}</div>
        <div style={{ marginTop: 6, fontWeight: 800 }}>
          Статус: <span style={{ color: '#111827' }}>{doctor.status}</span>
        </div>

        <div style={{ marginTop: 10, display: 'grid', gap: 8, fontSize: 13 }}>
          <div><b>Специализация:</b> {doctor.speciality1}{doctor.speciality2 ? `, ${doctor.speciality2}` : ''}{doctor.speciality3 ? `, ${doctor.speciality3}` : ''}</div>
          <div><b>Город:</b> {doctor.city || '—'}</div>
          <div><b>Стаж:</b> {doctor.experienceYears} лет</div>
          <div><b>Email:</b> {doctor.email}</div>
          <div><b>SubmittedAt:</b> {doctor.submittedAt ? new Date(doctor.submittedAt).toLocaleString() : '—'}</div>
        </div>

        <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

        <div style={{ display: 'grid', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Фото профиля</div>
            {doctor.profilePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={doctor.profilePhotoUrl} alt="profile" style={{ width: '100%', borderRadius: 14, border: '1px solid #e5e7eb' }} />
            ) : (
              <div style={{ opacity: 0.7 }}>Не загружено</div>
            )}
          </div>

          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Диплом</div>
            {doctor.diplomaPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={doctor.diplomaPhotoUrl} alt="diploma" style={{ width: '100%', borderRadius: 14, border: '1px solid #e5e7eb' }} />
            ) : (
              <div style={{ opacity: 0.7 }}>Не загружено</div>
            )}
          </div>
        </div>

        <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

        <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
          <div><b>Образование:</b><br />{doctor.education}</div>
          <div><b>О себе:</b><br />{doctor.about}</div>
          <div><b>Специализация подробно:</b><br />{doctor.specialityDetails}</div>
          <div><b>Опыт подробно:</b><br />{doctor.experienceDetails}</div>
        </div>

        <p style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
          Дальше добавим кнопки: APPROVE / NEED_FIX / REJECT (через отдельные admin API).
        </p>
      </div>
    </main>
  );
}
