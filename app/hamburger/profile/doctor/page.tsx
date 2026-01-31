/* path: app/hamburger/profile/doctor/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../components/TopBarBack';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

/* cookie helpers */
function setCookie(name: string, value: string, days = 3) {
  try {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  } catch {}
}
function getCookie(name: string): string {
  try {
    const rows = document.cookie ? document.cookie.split('; ') : [];
    for (const row of rows) {
      const [k, ...rest] = row.split('=');
      if (decodeURIComponent(k) === name) return decodeURIComponent(rest.join('='));
    }
  } catch {}
  return '';
}
function getInitDataFromCookie(): string {
  return getCookie('tg_init_data');
}

type DoctorDto = {
  id: string;
  status: string;
  statusRu?: string;
  canAccessDoctorCabinet?: boolean;

  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  city: string | null;
  speciality1: string | null;
  speciality2: string | null;
  speciality3: string | null;
  experienceYears: number | null;

  about: string | null;
  specialityDetails: string | null;
  experienceDetails: string | null;
  education: string | null;
  workplace: string | null;
  position: string | null;

  avatarUrl: string | null;

  stats?: {
    consultationsCount: number;
    reviewsCount: number;
  };
};

type DoctorMeOk = {
  ok: true;
  telegramId: string;
  isDoctor: boolean;
  doctor: DoctorDto | null;
};

type DoctorMeErr = { ok: false; error: string; hint?: string };
type DoctorMeResponse = DoctorMeOk | DoctorMeErr;

function fullName(d: DoctorDto | null) {
  const a = String(d?.lastName ?? '').trim();
  const b = String(d?.firstName ?? '').trim();
  const c = String(d?.middleName ?? '').trim();
  return [a, b, c].filter(Boolean).join(' ').trim() || '—';
}

function specsLine(d: DoctorDto | null) {
  const parts = [d?.speciality1, d?.speciality2, d?.speciality3].filter(Boolean).map((x) => String(x).trim());
  return parts.length ? parts.join(', ') : '—';
}

function avatarLetter(d: DoctorDto | null) {
  const n = String(d?.lastName || d?.firstName || 'D').trim();
  return (n[0] || 'D').toUpperCase();
}

function show(v: any) {
  const s = String(v ?? '').trim();
  return s.length ? s : '—';
}

function formatInt(n: any) {
  const x = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(x)) return '0';
  return String(Math.trunc(x));
}

export default function DoctorProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');
  const [doctor, setDoctor] = useState<DoctorDto | null>(null);
  const [tab, setTab] = useState<'about' | 'reviews'>('about');

  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try {
      WebApp?.ready?.();
    } catch {}

    const initData = (WebApp?.initData as string) || getInitDataFromCookie();
    if (WebApp?.initData && typeof WebApp.initData === 'string' && WebApp.initData.length > 0) {
      setCookie('tg_init_data', WebApp.initData, 3);
    }

    (async () => {
      try {
        setLoading(true);
        setWarn('');

        if (!initData) {
          setWarn('Нет initData от Telegram. Открой из бота.');
          router.replace('/hamburger/profile');
          return;
        }

        const rDoc = await fetch('/api/doctor/me', {
          method: 'GET',
          headers: {
            'X-Telegram-Init-Data': initData,
            'X-Init-Data': initData,
          },
          cache: 'no-store',
        });

        const jDoc = (await rDoc.json().catch(() => null)) as DoctorMeResponse | null;

        const canStayHere =
          !!jDoc &&
          (jDoc as any).ok === true &&
          (jDoc as DoctorMeOk).isDoctor === true &&
          !!(jDoc as DoctorMeOk).doctor?.canAccessDoctorCabinet;

        if (!canStayHere) {
          router.replace('/hamburger/profile');
          return;
        }

        setDoctor((jDoc as DoctorMeOk).doctor);
      } catch (e) {
        console.error(e);
        setWarn('Ошибка запроса /api/doctor/me');
        router.replace('/hamburger/profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const name = useMemo(() => (loading ? '...' : fullName(doctor)), [doctor, loading]);
  const specs = useMemo(() => specsLine(doctor), [doctor]);

  const expYears = doctor?.experienceYears ?? null;
  const consults = doctor?.stats?.consultationsCount ?? 0;
  const reviews = doctor?.stats?.reviewsCount ?? 0;

  const ratingValue = '5.0'; // пока статично как у тебя везде

  const onLeaveReview = () => {
    haptic('light');
    if (doctor?.id) {
      router.push(`/hamburger/doctor/${doctor.id}`); // если у тебя там будет “оставить отзыв”
    }
  };

  return (
    <main className="page">
      <TopBarBack />

      <section className="hero">
        <div className="avatarWrap" aria-label="Фото врача">
          {doctor?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="avatarImg" src={doctor.avatarUrl} alt="" />
          ) : (
            <div className="avatarPh">{avatarLetter(doctor)}</div>
          )}
        </div>

        <div className="name">{name}</div>
        <div className="specs">{specs}</div>

        <div className="ratingRow" aria-label="Рейтинг">
          <span className="stars">★★★★★</span>
        </div>

        {/* ✅ строка под звёздами */}
        <button type="button" className="leaveReview" onClick={onLeaveReview}>
          оставить отзыв
        </button>
      </section>

      <section className="stats">
        <div className="stat">
          <div className="statVal">{expYears !== null ? formatInt(expYears) : '—'}</div>
          <div className="statLab">лет стажа</div>
        </div>

        <div className="divider" />

        <div className="stat">
          <div className="statVal">{formatInt(consults)}</div>
          <div className="statLab">консультаций</div>
        </div>

        <div className="divider" />

        <div className="stat">
          <div className="statVal">{formatInt(reviews)}</div>
          <div className="statLab">отзывов</div>
        </div>
      </section>

      {warn ? <p className="warn">{warn}</p> : null}

      <section className="tabs">
        <button
          type="button"
          className={tab === 'about' ? 'tab tabActive' : 'tab'}
          onClick={() => setTab('about')}
        >
          О враче
        </button>

        <button
          type="button"
          className={tab === 'reviews' ? 'tab tabActive' : 'tab'}
          onClick={() => setTab('reviews')}
        >
          Отзывы
        </button>
      </section>

      <section className="content">
        {tab === 'about' ? (
          <>
            <div className="block">
              <div className="blockTitle">Описание</div>
              <div className="blockText">{show(doctor?.about)}</div>
            </div>

            <div className="block">
              <div className="blockTitle">О враче</div>
              <div className="blockText">
                <b>Образование:</b> {show(doctor?.education)}
                <br />
                <b>Место работы:</b> {show(doctor?.workplace)}
                <br />
                <b>Должность:</b> {show(doctor?.position)}
              </div>
            </div>

            <div className="block">
              <div className="blockTitle">Занимаюсь следующими вопросами</div>
              <div className="blockText">{show(doctor?.specialityDetails)}</div>
            </div>

            <div className="block">
              <div className="blockTitle">Опыт</div>
              <div className="blockText">{show(doctor?.experienceDetails)}</div>
            </div>
          </>
        ) : (
          <div className="block">
            <div className="blockTitle">Отзывы</div>
            <div className="blockText" style={{ opacity: 0.75 }}>
              Пока отзывов нет (или модуль отзывов ещё не подключён).
              <br />
              Рейтинг: <b>{ratingValue}</b>
            </div>
          </div>
        )}
      </section>

      <style jsx>{`
        .page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          background: #f6f7fb;
        }

        .hero {
          margin-top: 6px;
          background: #fff;
          border-radius: 18px;
          padding: 16px 14px 14px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .avatarWrap {
          width: 84px;
          height: 84px;
          border-radius: 999px;
          overflow: hidden;
          background: #f3f4f6;
          border: 1px solid rgba(15, 23, 42, 0.08);
          display: grid;
          place-items: center;
        }

        .avatarImg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .avatarPh {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          font-weight: 950;
          font-size: 30px;
          color: #111827;
          background: linear-gradient(135deg, rgba(229, 231, 235, 0.9), rgba(243, 244, 246, 1));
        }

        .name {
          margin-top: 10px;
          font-size: 18px;
          font-weight: 950;
          color: #111827;
        }

        .specs {
          margin-top: 4px;
          font-size: 13px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.65);
        }

        .ratingRow {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .stars {
          letter-spacing: 1px;
          color: #f59e0b;
          font-size: 16px;
          font-weight: 900;
        }

        .leaveReview {
          margin-top: 6px;
          border: none;
          background: transparent;
          color: #6d28d9;
          font-weight: 900;
          font-size: 13px;
          text-decoration: underline;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .leaveReview:active {
          opacity: 0.7;
          transform: scale(0.99);
        }

        .stats {
          margin-top: 10px;
          background: #fff;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.04);
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          align-items: center;
          padding: 10px 10px;
          gap: 10px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .statVal {
          font-size: 16px;
          font-weight: 950;
          color: #111827;
        }

        .statLab {
          font-size: 11px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.55);
        }

        .divider {
          width: 1px;
          height: 26px;
          background: rgba(17, 24, 39, 0.12);
          justify-self: center;
        }

        .warn {
          margin: 10px 0 0;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
          font-weight: 700;
        }

        .tabs {
          margin-top: 12px;
          background: #fff;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.04);
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
        }

        .tab {
          padding: 12px 10px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.55);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .tabActive {
          background: #6d28d9;
          color: #fff;
        }

        .content {
          margin-top: 10px;
          background: #fff;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.04);
          padding: 12px;
        }

        .block + .block {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(17, 24, 39, 0.08);
        }

        .blockTitle {
          font-size: 13px;
          font-weight: 950;
          color: #111827;
          margin-bottom: 6px;
        }

        .blockText {
          font-size: 13px;
          line-height: 1.5;
          color: rgba(17, 24, 39, 0.78);
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
      `}</style>
    </main>
  );
}
