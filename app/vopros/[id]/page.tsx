/* path: app/vopros/[id]/page.tsx */
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import TopBarBack from '../../../components/TopBarBack';
import { DoctorStatus, QuestionStatus } from '@prisma/client';
import PhotoLightbox from './PhotoLightbox';

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

function fmtDateTimeRuMsk(d: Date | null | undefined) {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  const ts = dt.getTime();
  if (!Number.isFinite(ts)) return '—';

  const datePart = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dt);

  const timePart = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(dt);

  return `${datePart} г., ${timePart}`;
}

function show(v: any) {
  if (v === null || v === undefined) return '—';
  const s = String(v);
  return s.trim().length ? s : '—';
}

/** Цена/Бесплатно: аккуратно читаем любые возможные поля, чтобы не ломать билд */
function priceBadgeLabel(q: any): string {
  const raw =
    q?.price ??
    q?.priceRub ??
    q?.priceRUB ??
    q?.amount ??
    q?.amountRub ??
    q?.amountRUB ??
    q?.cost ??
    q?.costRub ??
    q?.costRUB ??
    null;

  if (q?.isFree === true || q?.free === true) return 'Бесплатно';

  const n = typeof raw === 'number' ? raw : raw != null ? Number(String(raw).replace(',', '.')) : NaN;
  if (Number.isFinite(n) && n > 0) return `${Math.round(n)} ₽`;

  return 'Бесплатно';
}

/** ✅ Автор: если анонимно — НИКОГДА не показываем ник/имя */
function authorLabelFromQuestion(q: any): string {
  // ✅ ВАЖНО: у тебя в БД поле называется authorisanonymous
  const isAnon =
    q?.authorisanonymous === true ||
    q?.authorIsAnonymous === true ||
    q?.author_is_anonymous === true ||
    q?.isAnonymous === true ||
    q?.anonymous === true;

  if (isAnon) return 'Вопрос от Анонимно';

  const u = String(q?.authorUsername || q?.author_user_name || '').trim();
  if (u) return `Вопрос от @${u.replace(/^@+/, '')}`;

  const first = String(q?.authorFirstName || q?.author_first_name || '').trim();
  const last = String(q?.authorLastName || q?.author_last_name || '').trim();
  const full = [first, last].filter(Boolean).join(' ').trim();
  if (full) return `Вопрос от ${full}`;

  return 'Вопрос от Пользователь';
}

export default async function VoprosIdPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const pageStyle: React.CSSProperties = {
    padding: 16,
    overflowX: 'hidden',
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    border: '1px solid rgba(10,12,20,0.08)',
    background: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    padding: 14,
    boxShadow: '0 10px 26px rgba(18, 28, 45, 0.08)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'grid',
    gap: 12,
  };

  const wrapText: React.CSSProperties = {
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  };

  const q = await prisma.question.findUnique({
    where: { id },
    include: {
      files: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      assignedDoctor: {
        select: { id: true, firstName: true, lastName: true, middleName: true, speciality1: true },
      },
    },
  });

  if (!q) {
    return (
      <main style={pageStyle}>
        <TopBarBack />
        <h1 style={{ marginTop: 8, marginBottom: 0 }}>Не найдено</h1>
        <p style={{ opacity: 0.7, marginTop: 6 }}>Вопрос не найден.</p>
      </main>
    );
  }

  const botToken = envClean('TELEGRAM_BOT_TOKEN');
  const initData = cookies().get('tg_init_data')?.value || '';
  const tgId = botToken && initData ? verifyAndExtractTelegramId(initData, botToken) : null;

  const doctor = tgId
    ? await prisma.doctor.findUnique({
        where: { telegramId: tgId },
        select: { id: true, status: true, speciality1: true, speciality2: true, speciality3: true },
      })
    : null;

  const isApprovedDoctor = !!doctor && doctor.status === DoctorStatus.APPROVED;
  const isAuthor = !!tgId && q.authorTelegramId === tgId;

  const doctorSpecs = new Set(
    [doctor?.speciality1, doctor?.speciality2, doctor?.speciality3]
      .filter(Boolean)
      .map((x) => String(x).trim())
  );

  const doctorCanSeeByCategory = isApprovedDoctor ? doctorSpecs.has(String(q.speciality).trim()) : false;
  const doctorCanSeeByAssignment =
    isApprovedDoctor && q.assignedDoctorId ? q.assignedDoctorId === doctor?.id : false;

  const canSeePhotos = isAuthor || doctorCanSeeByCategory || doctorCanSeeByAssignment;

  const photoUrls = q.files
    .filter((f) => String(f.kind) === 'PHOTO')
    .sort((a, b) => (a.sortOrder - b.sortOrder) || (a.createdAt.getTime() - b.createdAt.getTime()))
    .map((f) => toPublicUrlMaybe(f.url))
    .filter(Boolean) as string[];

  const priceLabel = priceBadgeLabel(q as any);
  const authorText = authorLabelFromQuestion(q as any);

  return (
    <main style={pageStyle}>
      <TopBarBack />

      <h1 style={{ marginTop: 8, marginBottom: 10 }}>Вопрос</h1>

      <div style={cardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 900,
              padding: '6px 10px',
              borderRadius: 999,
              background: priceLabel === 'Бесплатно' ? 'rgba(59,130,246,0.10)' : 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(15,23,42,0.10)',
              color: priceLabel === 'Бесплатно' ? '#1e40af' : '#166534',
              whiteSpace: 'nowrap',
              flex: '0 0 auto',
            }}
            aria-label="Цена"
          >
            {priceLabel}
          </span>

          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: 'rgba(15,23,42,0.58)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
              flex: '1 1 auto',
              textAlign: 'right',
            }}
            aria-label="Автор вопроса"
            title={authorText}
          >
            {authorText}
          </div>
        </div>

        <div
          style={{
            fontWeight: 950,
            fontSize: 20,
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            marginTop: 2,
            ...wrapText,
          }}
        >
          {show(q.title)}
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: 'rgba(11,12,16,0.82)',
            whiteSpace: 'pre-wrap',
            ...wrapText,
          }}
        >
          {show(q.body)}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: 'rgba(15,23,42,0.78)',
              ...wrapText,
              flex: '1 1 auto',
              minWidth: 0,
            }}
          >
            {show(q.speciality)}
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(15,23,42,0.55)',
              whiteSpace: 'nowrap',
              flex: '0 0 auto',
            }}
          >
            {fmtDateTimeRuMsk(q.createdAt)}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(15,23,42,0.08)', margin: '6px 0' }} />

        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Фотографии</div>

          {photoUrls.length === 0 ? (
            <div style={{ opacity: 0.7 }}>Фото не прикреплены</div>
          ) : canSeePhotos ? (
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <PhotoLightbox urls={photoUrls} />
            </div>
          ) : (
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                background: 'rgba(15,23,42,0.03)',
                border: '1px solid rgba(15,23,42,0.08)',
                color: 'rgba(15,23,42,0.70)',
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1.35,
                ...wrapText,
              }}
            >
              Фото доступны только автору вопроса и врачам выбранной категории.
            </div>
          )}
        </div>

        {q.status === QuestionStatus.DONE ? (
          <div style={{ marginTop: 8, padding: 12, borderRadius: 14, background: 'rgba(15,23,42,0.03)' }}>
            <div style={{ fontWeight: 900 }}>Ответ готов</div>
            <div style={{ opacity: 0.75, marginTop: 4 }}>Скоро добавим отображение ответа врача.</div>
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 12, fontSize: 11, opacity: 0.65, ...wrapText }}>
        {!tgId
          ? 'Открыто публично. (Telegram ID не определён — фото скрыты.)'
          : isAuthor
          ? 'Вы автор этого вопроса.'
          : isApprovedDoctor
          ? 'Вы вошли как врач.'
          : 'Вы вошли как пользователь.'}
      </div>
    </main>
  );
}
