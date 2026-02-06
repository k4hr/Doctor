/* path: app/hamburger/profile/admin/doctor/[id]/page.tsx */
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import TopBarBack from '../../../../../../components/TopBarBack';
import { DoctorFileKind } from '@prisma/client';
import DoctorAdminActions from './DoctorAdminActions';
import ThumbnailPicker from './ThumbnailPicker';

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

/** ✅ Москва + формат: 26.01.2026 г., 14:07 (24 часа) */
function fmtDateTimeRuMsk(input: Date | string | null | undefined) {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(input);
  const ts = d.getTime();
  if (!Number.isFinite(ts)) return '—';

  const datePart = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);

  const timePart = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);

  return `${datePart} г., ${timePart}`;
}

function show(v: any) {
  if (v === null || v === undefined) return '—';
  const s = String(v);
  return s.trim().length ? s : '—';
}

function genderRu(v: string | null | undefined) {
  if (!v) return '—';
  if (v === 'male') return 'Мужской';
  if (v === 'female') return 'Женский';
  return v;
}

function degreeRu(v: string | null | undefined) {
  if (!v) return '—';
  if (v === 'none') return 'Нет';
  if (v === 'specialist') return 'Специалист';
  if (v === 'candidate') return 'Кандидат наук';
  if (v === 'doctor') return 'Доктор наук';
  return v;
}

function statusUi(status: string) {
  switch (status) {
    case 'APPROVED':
      return { label: 'Одобрена', bg: 'rgba(34,197,94,0.14)', fg: '#166534' };
    case 'PENDING':
      return { label: 'На модерации', bg: 'rgba(59,130,246,0.14)', fg: '#1e40af' };
    case 'NEED_FIX':
      return { label: 'Нужны правки', bg: 'rgba(245,158,11,0.16)', fg: '#92400e' };
    case 'REJECTED':
      return { label: 'Отклонена', bg: 'rgba(239,68,68,0.14)', fg: '#991b1b' };
    case 'DRAFT':
      return { label: 'Черновик', bg: 'rgba(156,163,175,0.16)', fg: '#374151' };
    default:
      return { label: status, bg: 'rgba(156,163,175,0.16)', fg: '#374151' };
  }
}

function pickCrop(raw: any): { x: number; y: number } | null {
  if (!raw || typeof raw !== 'object') return null;
  const x = Number((raw as any).x);
  const y = Number((raw as any).y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

export default async function DoctorAdminCardPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  const initData = cookies().get('tg_init_data')?.value || '';

  const tgId = botToken && initData ? verifyAndExtractTelegramId(initData, botToken) : null;
  const okAdmin = tgId ? isAdmin(tgId) : false;

  const pageStyle: React.CSSProperties = { padding: 16, overflowX: 'hidden' };
  const wrapText: React.CSSProperties = { overflowWrap: 'anywhere', wordBreak: 'break-word' };

  if (!tgId || !okAdmin) {
    return (
      <main style={pageStyle}>
        <TopBarBack />
        <h1 style={{ marginTop: 8 }}>Доступ запрещён</h1>
        <p style={{ opacity: 0.7 }}>Нужно открыть из Telegram и иметь права администратора.</p>
      </main>
    );
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      files: {
        where: { kind: { in: [DoctorFileKind.PROFILE_PHOTO, DoctorFileKind.DIPLOMA_PHOTO] } },
        orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });

  if (!doctor) {
    return (
      <main style={pageStyle}>
        <TopBarBack />
        <h1 style={{ marginTop: 8 }}>Не найдено</h1>
        <p style={{ opacity: 0.7 }}>Анкета врача не найдена.</p>
      </main>
    );
  }

  const fullName = [doctor.lastName, doctor.firstName, doctor.middleName].filter(Boolean).join(' ') || '—';
  const tgName =
    [doctor.telegramFirstName, doctor.telegramLastName].filter(Boolean).join(' ') ||
    (doctor.telegramUsername ? `@${doctor.telegramUsername}` : '') ||
    doctor.telegramId;

  const ui = statusUi(doctor.status);

  const profileUrls = doctor.files
    .filter((f) => f.kind === DoctorFileKind.PROFILE_PHOTO)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime())
    .map((f) => toPublicUrlMaybe(f.url))
    .filter(Boolean) as string[];

  const docsUrls = doctor.files
    .filter((f) => f.kind === DoctorFileKind.DIPLOMA_PHOTO)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime())
    .map((f) => toPublicUrlMaybe(f.url))
    .filter(Boolean) as string[];

  const initialCrop = pickCrop((doctor as any).profilephotocrop);

  return (
    <main style={pageStyle}>
      <TopBarBack />
      <h1 style={{ marginTop: 8 }}>Анкета врача</h1>

      <div
        style={{
          marginTop: 10,
          padding: 12,
          borderRadius: 14,
          border: '1px solid #e5e7eb',
          background: '#fff',
          overflow: 'hidden',
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 16, ...wrapText }}>{fullName}</div>
        <div style={{ opacity: 0.75, marginTop: 4, ...wrapText }}>Telegram: {tgName}</div>

        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 900 }}>Статус:</div>
          <div
            style={{
              fontWeight: 900,
              padding: '6px 10px',
              borderRadius: 999,
              background: ui.bg,
              color: ui.fg,
              border: '1px solid rgba(15,23,42,0.08)',
              maxWidth: '100%',
              ...wrapText,
            }}
          >
            {ui.label} <span style={{ opacity: 0.65 }}>({doctor.status})</span>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <DoctorAdminActions doctorId={doctor.id} currentStatus={doctor.status} />
        </div>

        {/* ✅ Выбор миниатюры */}
        <ThumbnailPicker doctorId={doctor.id} photoUrl={profileUrls[0] ?? null} initialCrop={initialCrop} />

        <hr style={{ margin: '14px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

        <div style={{ display: 'grid', gap: 10, fontSize: 13, ...wrapText }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>Личные данные</div>
          <div>
            <b>Фамилия:</b> {show(doctor.lastName)}
          </div>
          <div>
            <b>Имя:</b> {show(doctor.firstName)}
          </div>
          <div>
            <b>Отчество:</b> {show(doctor.middleName)}
          </div>
          <div>
            <b>Пол:</b> {genderRu(doctor.gender)}
          </div>
          <div>
            <b>Дата рождения:</b> {show(doctor.birthDay)}.{show(doctor.birthMonth)}.{show(doctor.birthYear)}
          </div>
          <div>
            <b>Город:</b> {show(doctor.city)}
          </div>

          <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px solid #eef2f7' }} />

          <div style={{ fontWeight: 900, fontSize: 14 }}>Профессия</div>
          <div>
            <b>Специализации:</b> {show(doctor.speciality1)}
            {doctor.speciality2 ? `, ${doctor.speciality2}` : ''}
            {doctor.speciality3 ? `, ${doctor.speciality3}` : ''}
          </div>
          <div>
            <b>Образование:</b>
            <br />
            {show(doctor.education)}
          </div>
          <div>
            <b>Степень:</b> {degreeRu(doctor.degree)}
          </div>
          <div>
            <b>Место работы:</b> {show(doctor.workplace)}
          </div>
          <div>
            <b>Должность:</b> {show(doctor.position)}
          </div>
          <div>
            <b>Стаж (лет):</b> {show(doctor.experienceYears)}
          </div>
          <div>
            <b>Награды:</b>
            <br />
            {show(doctor.awards)}
          </div>

          <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px solid #eef2f7' }} />

          <div style={{ fontWeight: 900, fontSize: 14 }}>Контакты</div>
          <div>
            <b>Email:</b> {show(doctor.email)}
          </div>

          <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px solid #eef2f7' }} />

          <div style={{ fontWeight: 900, fontSize: 14 }}>Описание</div>
          <div>
            <b>О себе:</b>
            <br />
            {show(doctor.about)}
          </div>
          <div>
            <b>Специализация подробно:</b>
            <br />
            {show(doctor.specialityDetails)}
          </div>
          <div>
            <b>Опыт работы:</b>
            <br />
            {show(doctor.experienceDetails)}
          </div>
          <div>
            <b>Курсы:</b>
            <br />
            {show(doctor.courses)}
          </div>
          <div>
            <b>Достижения:</b>
            <br />
            {show(doctor.achievements)}
          </div>
          <div>
            <b>Публикации:</b>
            <br />
            {show(doctor.publications)}
          </div>

          <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px solid #eef2f7' }} />

          <div style={{ fontWeight: 900, fontSize: 14 }}>Системное</div>
          <div>
            <b>ID анкеты:</b> <span style={wrapText}>{doctor.id}</span>
          </div>
          <div>
            <b>Дата создания:</b> {fmtDateTimeRuMsk(doctor.createdAt)}
          </div>
          <div>
            <b>Дата обновления:</b> {fmtDateTimeRuMsk(doctor.updatedAt)}
          </div>
          <div>
            <b>Дата отправки на модерацию:</b> {fmtDateTimeRuMsk(doctor.submittedAt)}
          </div>
        </div>

        <hr style={{ margin: '14px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

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
                      background: '#f3f4f6',
                      maxWidth: '100%',
                      display: 'block',
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
              Документы/дипломы {docsUrls.length ? <span style={{ opacity: 0.7 }}>({docsUrls.length})</span> : null}
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
                      background: '#f3f4f6',
                      maxWidth: '100%',
                      display: 'block',
                    }}
                  />
                ))}
              </div>
            ) : (
              <div style={{ opacity: 0.7 }}>Не загружено</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
