/* path: app/vopros/[id]/page.tsx */
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import TopBarBack from '../../../components/TopBarBack';
import { DoctorStatus, QuestionStatus } from '@prisma/client';

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

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

function statusUi(status: string) {
  // только 2 статуса для UI: "Врач отвечает" и "Ждёт ответа"
  if (status === 'IN_PROGRESS') {
    return { label: 'Врач отвечает', bg: 'rgba(36,199,104,0.10)', fg: '#166534', border: 'rgba(36,199,104,0.30)' };
  }
  return { label: 'Ждёт ответа', bg: 'rgba(15,23,42,0.04)', fg: 'rgba(15,23,42,0.70)', border: 'rgba(15,23,42,0.12)' };
}

function show(v: any) {
  if (v === null || v === undefined) return '—';
  const s = String(v);
  return s.trim().length ? s : '—';
}

export default async function VoprosIdPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // 1) проверяем Telegram initData (как у тебя в админке)
  const botToken = envClean('TELEGRAM_BOT_TOKEN');
  const initData = cookies().get('tg_init_data')?.value || '';

  const tgId = botToken && initData ? verifyAndExtractTelegramId(initData, botToken) : null;

  if (!tgId) {
    return (
      <main style={{ padding: 16 }}>
        <TopBarBack />
        <h1 style={{ marginTop: 8 }}>Доступ ограничен</h1>
        <p style={{ opacity: 0.7 }}>
          Откройте страницу из Telegram WebApp (нужен tg_init_data cookie).
        </p>
      </main>
    );
  }

  // 2) определяем — это врач? (APPROVED) / пациент?
  const doctor = await prisma.doctor.findUnique({
    where: { telegramId: tgId },
    select: { id: true, status: true, speciality1: true, speciality2: true, speciality3: true },
  });

  const isApprovedDoctor = !!doctor && doctor.status === DoctorStatus.APPROVED;

  // 3) достаём вопрос + файлы + назначенного врача
  const q = await prisma.question.findUnique({
    where: { id },
    include: {
      files: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      assignedDoctor: { select: { id: true, firstName: true, lastName: true, middleName: true, speciality1: true } },
    },
  });

  if (!q) {
    return (
      <main style={{ padding: 16 }}>
        <TopBarBack />
        <h1 style={{ marginTop: 8 }}>Не найдено</h1>
        <p style={{ opacity: 0.7 }}>Вопрос не найден.</p>
      </main>
    );
  }

  // 4) доступ:
  // - автор вопроса всегда видит
  // - одобренный врач видит только если:
  //    a) вопрос по его категории (speciality совпадает с одной из его специализаций)
  //    b) ИЛИ вопрос назначен именно ему (assignedDoctorId)
  const isAuthor = q.authorTelegramId === tgId;

  const doctorSpecs = new Set(
    [doctor?.speciality1, doctor?.speciality2, doctor?.speciality3].filter(Boolean).map((x) => String(x).trim())
  );

  const doctorCanSeeByCategory = isApprovedDoctor ? doctorSpecs.has(String(q.speciality).trim()) : false;
  const doctorCanSeeByAssignment = isApprovedDoctor && q.assignedDoctorId ? q.assignedDoctorId === doctor?.id : false;

  const canSee = isAuthor || doctorCanSeeByCategory || doctorCanSeeByAssignment;

  if (!canSee) {
    return (
      <main style={{ padding: 16 }}>
        <TopBarBack />
        <h1 style={{ marginTop: 8 }}>Доступ ограничен</h1>
        <p style={{ opacity: 0.7 }}>
          Фото и детали вопроса доступны только автору или врачам выбранной категории.
        </p>
      </main>
    );
  }

  const ui = statusUi(q.status);

  const assignedDoctorName = q.assignedDoctor
    ? [q.assignedDoctor.lastName, q.assignedDoctor.firstName, q.assignedDoctor.middleName].filter(Boolean).join(' ')
    : null;

  const photoUrls = q.files
    .filter((f) => String(f.kind) === 'PHOTO')
    .sort((a, b) => (a.sortOrder - b.sortOrder) || (a.createdAt.getTime() - b.createdAt.getTime()))
    .map((f) => toPublicUrlMaybe(f.url))
    .filter(Boolean) as string[];

  return (
    <main style={{ padding: 16 }}>
      <TopBarBack />

      <h1 style={{ marginTop: 8, marginBottom: 10 }}>Вопрос</h1>

      <div
        style={{
          border: '1px solid rgba(10,12,20,0.08)',
          background: 'rgba(255,255,255,0.92)',
          borderRadius: 18,
          padding: 14,
          boxShadow: '0 10px 26px rgba(18, 28, 45, 0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'grid',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 18, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            {show(q.title)}
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: '7px 12px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
              background: ui.bg,
              color: ui.fg,
              border: `1px solid ${ui.border}`,
            }}
          >
            {ui.label}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(15,23,42,0.04)',
              color: 'rgba(15,23,42,0.85)',
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            {show(q.speciality)}
          </span>

          {assignedDoctorName ? (
            <span style={{ fontSize: 12, color: 'rgba(15,23,42,0.65)', fontWeight: 700 }}>
              Врач: {assignedDoctorName}
            </span>
          ) : null}

          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(15,23,42,0.55)', fontWeight: 700 }}>
            {fmtDate(q.createdAt)}
          </span>
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: 'rgba(11,12,16,0.80)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {show(q.body)}
        </div>

        {Array.isArray(q.keywords) && q.keywords.length ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
            {q.keywords.slice(0, 20).map((k) => (
              <span
                key={k}
                style={{
                  padding: '5px 9px',
                  borderRadius: 999,
                  border: '1px solid rgba(15,23,42,0.10)',
                  background: 'rgba(15,23,42,0.03)',
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'rgba(15,23,42,0.70)',
                }}
              >
                {k}
              </span>
            ))}
          </div>
        ) : null}

        <hr style={{ border: 'none', borderTop: '1px solid rgba(15,23,42,0.08)', margin: '6px 0' }} />

        <div>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Фотографии</div>

          {photoUrls.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {photoUrls.map((u) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={u}
                  src={u}
                  alt="photo"
                  style={{
                    width: '100%',
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 14,
                    border: '1px solid rgba(15,23,42,0.08)',
                    background: '#f3f4f6',
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.7 }}>Фото не прикреплены</div>
          )}
        </div>

        {/* на будущее: тут будет блок ответа врача */}
        {q.status === QuestionStatus.DONE ? (
          <div style={{ marginTop: 8, padding: 12, borderRadius: 14, background: 'rgba(15,23,42,0.03)' }}>
            <div style={{ fontWeight: 900 }}>Ответ готов</div>
            <div style={{ opacity: 0.75, marginTop: 4 }}>Скоро добавим отображение ответа врача.</div>
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 12, fontSize: 11, opacity: 0.65 }}>
        {isAuthor ? 'Вы автор этого вопроса.' : isApprovedDoctor ? 'Вы вошли как врач.' : 'Вы вошли как пользователь.'}
      </div>
    </main>
  );
}
