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

function statusUi(status: string) {
  if (status === 'IN_PROGRESS') {
    return {
      label: 'Врач отвечает',
      bg: 'rgba(36,199,104,0.10)',
      fg: '#166534',
      border: 'rgba(36,199,104,0.30)',
    };
  }
  return {
    label: 'Ждёт ответа',
    bg: 'rgba(15,23,42,0.04)',
    fg: 'rgba(15,23,42,0.70)',
    border: 'rgba(15,23,42,0.12)',
  };
}

function show(v: any) {
  if (v === null || v === undefined) return '—';
  const s = String(v);
  return s.trim().length ? s : '—';
}

export default async function VoprosIdPage({ params }: { params: { id: string } }) {
  const { id } = params;

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
      <main className="page">
        <div className="container">
          <TopBarBack />
          <h1 className="h1">Не найдено</h1>
          <p className="muted">Вопрос не найден.</p>
        </div>

        <style jsx>{`
          .page {
            padding: 16px;
            overflow-x: hidden;
          }
          .container {
            max-width: 720px;
            margin: 0 auto;
          }
          .h1 {
            margin-top: 8px;
            margin-bottom: 0;
          }
          .muted {
            opacity: 0.7;
            margin-top: 6px;
          }
        `}</style>
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

  const ui = statusUi(q.status);

  const assignedDoctorName = q.assignedDoctor
    ? [q.assignedDoctor.lastName, q.assignedDoctor.firstName, q.assignedDoctor.middleName]
        .filter(Boolean)
        .join(' ')
    : null;

  const photoUrls = q.files
    .filter((f) => String(f.kind) === 'PHOTO')
    .sort((a, b) => (a.sortOrder - b.sortOrder) || (a.createdAt.getTime() - b.createdAt.getTime()))
    .map((f) => toPublicUrlMaybe(f.url))
    .filter(Boolean) as string[];

  return (
    <main className="page">
      <div className="container">
        <TopBarBack />

        <h1 className="h1">Вопрос</h1>

        <div className="card">
          <div className="head">
            <div className="title">{show(q.title)}</div>

            <div className="statusPill" style={{ background: ui.bg, color: ui.fg, border: `1px solid ${ui.border}` }}>
              {ui.label}
            </div>
          </div>

          <div className="meta">
            <div className="metaLeft">
              <span className="chip">{show(q.speciality)}</span>

              {assignedDoctorName ? <span className="doctor">Врач: {assignedDoctorName}</span> : null}
            </div>

            <div className="time">{fmtDateTimeRuMsk(q.createdAt)}</div>
          </div>

          <div className="body">{show(q.body)}</div>

          {Array.isArray(q.keywords) && q.keywords.length ? (
            <div className="tags">
              {q.keywords.slice(0, 20).map((k) => (
                <span key={k} className="tag">
                  {k}
                </span>
              ))}
            </div>
          ) : null}

          <hr className="hr" />

          <div className="photos">
            <div className="photosTitle">Фотографии</div>

            {photoUrls.length === 0 ? (
              <div className="muted">Фото не прикреплены</div>
            ) : canSeePhotos ? (
              <div className="photosInner">
                <PhotoLightbox urls={photoUrls} />
              </div>
            ) : (
              <div className="notice">
                Фото доступны только автору вопроса и врачам выбранной категории.
              </div>
            )}
          </div>

          {q.status === QuestionStatus.DONE ? (
            <div className="doneBox">
              <div className="doneTitle">Ответ готов</div>
              <div className="doneText">Скоро добавим отображение ответа врача.</div>
            </div>
          ) : null}
        </div>

        <div className="foot">
          {!tgId
            ? 'Открыто публично. (Telegram ID не определён — фото скрыты.)'
            : isAuthor
            ? 'Вы автор этого вопроса.'
            : isApprovedDoctor
            ? 'Вы вошли как врач.'
            : 'Вы вошли как пользователь.'}
        </div>
      </div>

      <style jsx>{`
        .page {
          padding: 16px;
          overflow-x: hidden; /* ✅ убираем горизонтальный скролл вообще */
        }

        .container {
          max-width: 720px;
          margin: 0 auto;
          width: 100%;
          overflow-x: hidden; /* ✅ фикс от “вылезло вправо” */
        }

        .h1 {
          margin-top: 8px;
          margin-bottom: 10px;
        }

        .card {
          width: 100%;
          max-width: 100%;
          overflow: hidden; /* ✅ всё держим внутри */
          border: 1px solid rgba(10, 12, 20, 0.08);
          background: rgba(255, 255, 255, 0.92);
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: grid;
          gap: 10px;
        }

        .head {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: start;
          gap: 10px;
          min-width: 0;
        }

        .title {
          min-width: 0;
          font-weight: 900;
          font-size: 18px;
          line-height: 1.15;
          letter-spacing: -0.01em;

          /* ✅ если внезапно кто-то вставил 300 символов без пробелов */
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .statusPill {
          font-size: 12px;
          font-weight: 800;
          padding: 7px 12px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .meta {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .metaLeft {
          min-width: 0;
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap; /* ✅ чтобы не растягивало по горизонтали */
        }

        .chip {
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.04);
          color: rgba(15, 23, 42, 0.85);
          font-weight: 800;
          font-size: 12px;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .doctor {
          font-size: 12px;
          color: rgba(15, 23, 42, 0.65);
          font-weight: 700;
          min-width: 0;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        .time {
          font-size: 12px;
          color: rgba(15, 23, 42, 0.55);
          font-weight: 700;
          white-space: nowrap;
        }

        .body {
          font-size: 14px;
          line-height: 1.5;
          color: rgba(11, 12, 16, 0.8);
          white-space: pre-wrap;

          /* ✅ это и лечит “уехало вправо” от длинных слов/строк */
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 2px;
          min-width: 0;
        }

        .tag {
          padding: 5px 9px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: rgba(15, 23, 42, 0.03);
          font-size: 12px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.7);

          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hr {
          border: none;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          margin: 6px 0;
        }

        .photos {
          min-width: 0;
          overflow: hidden; /* ✅ чтобы лайтбокс/превью не ломали ширину */
        }

        .photosTitle {
          font-weight: 900;
          margin-bottom: 8px;
        }

        .photosInner {
          min-width: 0;
          overflow: hidden;
        }

        .muted {
          opacity: 0.7;
        }

        .notice {
          padding: 12px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.03);
          border: 1px solid rgba(15, 23, 42, 0.08);
          color: rgba(15, 23, 42, 0.7);
          font-size: 12px;
          font-weight: 700;
          line-height: 1.35;

          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .doneBox {
          margin-top: 8px;
          padding: 12px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.03);
          overflow: hidden;
        }

        .doneTitle {
          font-weight: 900;
        }

        .doneText {
          opacity: 0.75;
          margin-top: 4px;
        }

        .foot {
          margin-top: 12px;
          font-size: 11px;
          opacity: 0.65;

          overflow-wrap: anywhere;
          word-break: break-word;
        }

        /* ✅ супер-важно: любые img внутри карточки не могут быть шире контейнера */
        .card :global(img) {
          max-width: 100%;
          height: auto;
        }
      `}</style>

      {/* ✅ страховка от горизонтального скролла на уровне страницы/вебвью */}
      <style jsx global>{`
        html,
        body {
          overflow-x: hidden;
        }
      `}</style>
    </main>
  );
}
