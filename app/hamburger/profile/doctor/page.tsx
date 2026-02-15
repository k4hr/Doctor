/* path: app/hamburger/profile/doctor/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../components/TopBarBack';

// ✅ badges
import DocumentBadge from '../../../../components/bage/document';
import ProBadge from '../../../../components/bage/pro';

// ✅ down bar (doctor)
import DownBarDoctor from '../../../../components/DownBarDoctor';

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

type ReviewItem = {
  id: string;
  createdAt: string; // ISO
  rating: number; // 1..5
  text: string | null;
  isVerified: boolean;
};

type ReviewsOk = {
  ok: true;
  doctorId: string | null;
  rating: { value: number; count: number };
  items: ReviewItem[];
};
type ReviewsErr = { ok: false; error: string; hint?: string };
type ReviewsResponse = ReviewsOk | ReviewsErr;

// ✅ PRO статус (реальный)
type ProStatusOk = { ok: true; isDoctor: boolean; isPro: boolean; proUntil: string | null };
type ProStatusErr = { ok: false; error: string; hint?: string };
type ProStatusResp = ProStatusOk | ProStatusErr;

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

function round1(x: number) {
  return Math.round(x * 10) / 10;
}

function fmtRating(x: any) {
  const n = typeof x === 'number' ? x : Number(x);
  const v = Number.isFinite(n) ? round1(n) : 0;
  return v.toFixed(1).replace('.', ',');
}

function fmtDateRu(iso: string) {
  try {
    const d = new Date(iso);
    const ts = d.getTime();
    if (!Number.isFinite(ts)) return '';
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  } catch {
    return '';
  }
}

function Stars({ value }: { value: number }) {
  const v = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;
  const pct = (v / 5) * 100;

  return (
    <span className="stars" aria-label={`Рейтинг ${v.toFixed(1)}`}>
      <span className="starsBase">★★★★★</span>
      <span className="starsFill" style={{ width: `${pct}%` }}>
        ★★★★★
      </span>

      <style jsx>{`
        .stars {
          position: relative;
          display: inline-block;
          font-size: 18px;
          line-height: 1;
          letter-spacing: 2px;
          user-select: none;
        }
        .starsBase {
          color: rgba(17, 24, 39, 0.18);
          font-weight: 900;
        }
        .starsFill {
          position: absolute;
          left: 0;
          top: 0;
          overflow: hidden;
          white-space: nowrap;
          color: #f59e0b;
          font-weight: 900;
        }
      `}</style>
    </span>
  );
}

export default function DoctorProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');
  const [doctor, setDoctor] = useState<DoctorDto | null>(null);
  const [tab, setTab] = useState<'about' | 'reviews'>('about');

  const [initData, setInitData] = useState<string>('');

  const [canOpenCabinet, setCanOpenCabinet] = useState(false);

  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsWarn, setReviewsWarn] = useState('');
  const [reviewsItems, setReviewsItems] = useState<ReviewItem[]>([]);
  const [ratingAvg, setRatingAvg] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  // ✅ PRO status (реальный)
  const [proLoading, setProLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [proUntil, setProUntil] = useState<string | null>(null);

  const onOpenCabinet = () => {
    haptic('light');

    if (!canOpenCabinet) {
      setWarn('Кабинет доступен только подтверждённым врачам.');
      return;
    }

    router.push('/hamburger/profile/doctor/settings');
  };

  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try {
      WebApp?.ready?.();
    } catch {}

    const idata = (WebApp?.initData as string) || getInitDataFromCookie();
    if (WebApp?.initData && typeof WebApp.initData === 'string' && WebApp.initData.length > 0) {
      setCookie('tg_init_data', WebApp.initData, 3);
    }
    setInitData(idata || '');

    (async () => {
      try {
        setLoading(true);
        setWarn('');
        setCanOpenCabinet(false);

        if (!idata) {
          setWarn('Нет initData от Telegram. Открой из бота.');
          router.replace('/hamburger/profile');
          return;
        }

        const rDoc = await fetch('/api/doctor/me', {
          method: 'GET',
          headers: { 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
          cache: 'no-store',
        });

        const jDoc = (await rDoc.json().catch(() => null)) as DoctorMeResponse | null;

        const ok =
          !!jDoc &&
          (jDoc as any).ok === true &&
          (jDoc as DoctorMeOk).isDoctor === true &&
          !!(jDoc as DoctorMeOk).doctor;

        if (!ok) {
          router.replace('/hamburger/profile');
          return;
        }

        const d = (jDoc as DoctorMeOk).doctor;
        setDoctor(d);

        const isApproved = String(d?.status || '').toUpperCase() === 'APPROVED';
        setCanOpenCabinet(isApproved);

        if (!isApproved) {
          setWarn('Документы ещё не подтверждены. Кабинет (баланс/вывод/история) станет доступен после APPROVED.');
        }
      } catch (e) {
        console.error(e);
        setWarn('Ошибка запроса /api/doctor/me');
        router.replace('/hamburger/profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // ✅ грузим PRO статус врача (по initData)
  useEffect(() => {
    (async () => {
      try {
        setProLoading(true);
        setIsPro(false);
        setProUntil(null);

        if (!initData) return;

        const r = await fetch('/api/pro/status', {
          method: 'GET',
          headers: { 'X-Telegram-Init-Data': initData, 'X-Init-Data': initData },
          cache: 'no-store',
        });

        const j = (await r.json().catch(() => null)) as ProStatusResp | null;

        if (!r.ok || !j || (j as any).ok !== true) {
          setIsPro(false);
          setProUntil(null);
          return;
        }

        const ok = j as ProStatusOk;
        setIsPro(Boolean(ok.isPro));
        setProUntil(ok.proUntil ? String(ok.proUntil) : null);
      } catch (e) {
        console.error(e);
        setIsPro(false);
        setProUntil(null);
      } finally {
        setProLoading(false);
      }
    })();
  }, [initData]);

  // грузим отзывы, когда знаем doctor.id
  useEffect(() => {
    (async () => {
      try {
        if (!doctor?.id) return;
        if (!initData) return;

        setReviewsLoading(true);
        setReviewsWarn('');

        const r = await fetch(`/api/doctor/reviews?doctorId=${encodeURIComponent(doctor.id)}&limit=50`, {
          method: 'GET',
          headers: { 'X-Telegram-Init-Data': initData, 'X-Init-Data': initData },
          cache: 'no-store',
        });

        const j = (await r.json().catch(() => null)) as ReviewsResponse | null;

        if (!r.ok || !j || (j as any).ok !== true) {
          setReviewsWarn((j as any)?.hint || (j as any)?.error || 'Не удалось загрузить отзывы');
          setReviewsItems([]);
          setRatingAvg(0);
          setRatingCount(0);
          return;
        }

        const ok = j as ReviewsOk;
        setReviewsItems(ok.items || []);
        setRatingAvg(typeof ok.rating?.value === 'number' ? ok.rating.value : 0);
        setRatingCount(typeof ok.rating?.count === 'number' ? ok.rating.count : ok.items?.length || 0);
        setReviewsWarn('');
      } catch (e) {
        console.error(e);
        setReviewsWarn('Ошибка сети/сервера при загрузке отзывов');
        setReviewsItems([]);
        setRatingAvg(0);
        setRatingCount(0);
      } finally {
        setReviewsLoading(false);
      }
    })();
  }, [doctor?.id, initData]);

  const name = useMemo(() => (loading ? '...' : fullName(doctor)), [doctor, loading]);
  const specs = useMemo(() => specsLine(doctor), [doctor]);

  const expYears = doctor?.experienceYears ?? null;
  const answers = doctor?.stats?.consultationsCount ?? 0;
  const reviewsStat = doctor?.stats?.reviewsCount ?? 0;

  const ratingLabel = useMemo(() => fmtRating(ratingAvg), [ratingAvg]);
  const starsValue = useMemo(() => {
    const v = typeof ratingAvg === 'number' && Number.isFinite(ratingAvg) ? ratingAvg : 0;
    return Math.max(0, Math.min(5, v));
  }, [ratingAvg]);

  const showProBadge = !proLoading && isPro;

  return (
    <main className="page">
      <TopBarBack />

      <div className="wrap">
        <section className="hero">
          <button
            type="button"
            className="cabinetBtn"
            onClick={onOpenCabinet}
            aria-label="Личный кабинет врача"
            disabled={!canOpenCabinet}
            title={!canOpenCabinet ? 'Доступно после подтверждения' : 'Кабинет'}
          >
            <span className="cabinetIcon" aria-hidden="true">
              ⚙️
            </span>
          </button>

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
            <Stars value={starsValue} />
          </div>

          <div className="ratingText">
            Рейтинг: <b>{ratingLabel}</b> <span className="ratingCount">({formatInt(ratingCount)})</span>
          </div>

          {/* ✅ badges: документы у всех, PRO только если активен */}
          <div className="badgesRow" aria-label="Бейджи">
            <DocumentBadge size="sm" text="Документы подтверждены" />
            {showProBadge ? (
              <ProBadge
                size="sm"
                text={proUntil ? `Имеет статус ВРАЧ.PRO\nАктивно до: ${String(proUntil).slice(0, 10)}` : 'Имеет статус ВРАЧ.PRO'}
              />
            ) : null}
          </div>
        </section>

        <section className="stats">
          <div className="stat">
            <div className="statVal">{expYears !== null ? formatInt(expYears) : '—'}</div>
            <div className="statLab">лет стажа</div>
          </div>

          <div className="divider" />

          <div className="stat">
            <div className="statVal">{formatInt(answers)}</div>
            <div className="statLab">ответов</div>
          </div>

          <div className="divider" />

          <div className="stat">
            <div className="statVal">{formatInt(reviewsStat || ratingCount)}</div>
            <div className="statLab">отзывов</div>
          </div>
        </section>

        {warn ? <p className="warn">{warn}</p> : null}

        <section className="tabs">
          <button type="button" className={tab === 'about' ? 'tab tabActive' : 'tab'} onClick={() => setTab('about')}>
            О враче
          </button>

          <button type="button" className={tab === 'reviews' ? 'tab tabActive' : 'tab'} onClick={() => setTab('reviews')}>
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
            <>
              <div className="reviewsHeader">
                <div className="reviewsTitle">Отзывы</div>
                <div className="reviewsMeta">
                  <span className="metaStars">
                    <Stars value={starsValue} />
                  </span>
                  <span className="metaText">
                    {ratingLabel} · {formatInt(ratingCount)} отзывов
                  </span>
                </div>
              </div>

              {reviewsWarn ? <p className="warnSmall">{reviewsWarn}</p> : null}
              {reviewsLoading ? <p className="muted">Загрузка…</p> : null}
              {!reviewsLoading && !reviewsItems.length ? <p className="muted">Пока отзывов нет.</p> : null}

              <div className="reviewsList">
                {reviewsItems.map((r) => (
                  <div key={r.id} className="reviewCard">
                    <div className="reviewTop">
                      <span className="reviewStars">
                        <Stars value={Math.max(0, Math.min(5, Number(r.rating) || 0))} />
                      </span>
                      <span className="reviewDate">{fmtDateRu(r.createdAt)}</span>
                    </div>

                    {r.text ? <div className="reviewText">{r.text}</div> : <div className="reviewText muted">Без текста</div>}

                    {r.isVerified ? <div className="badgeOk">проверен</div> : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <DownBarDoctor />
      </div>

      <style jsx>{`
        .page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          background: #f6f7fb;
        }

        .wrap {
          max-width: 430px;
          margin: 0 auto;
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
          position: relative;
        }

        .cabinetBtn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(249, 250, 251, 0.92);
          box-shadow: 0 10px 20px rgba(18, 28, 45, 0.08);
          display: grid;
          place-items: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .cabinetBtn:disabled {
          opacity: 0.55;
          cursor: default;
        }
        .cabinetBtn:active:not(:disabled) {
          transform: scale(0.98);
          opacity: 0.95;
        }
        .cabinetIcon {
          font-size: 22px;
          line-height: 1;
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

        .ratingText {
          margin-top: 6px;
          font-size: 13px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.78);
        }

        .ratingCount {
          font-weight: 900;
          color: rgba(17, 24, 39, 0.45);
        }

        .badgesRow {
          margin-top: 10px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
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

        .reviewsHeader {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 10px;
        }

        .reviewsTitle {
          font-size: 14px;
          font-weight: 950;
          color: #111827;
        }

        .reviewsMeta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .metaText {
          font-size: 13px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.65);
        }

        .warnSmall {
          margin: 0 0 8px;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
          font-weight: 800;
        }

        .muted {
          margin: 0 0 10px;
          font-size: 13px;
          color: rgba(17, 24, 39, 0.55);
          font-weight: 800;
        }

        .reviewsList {
          display: grid;
          gap: 10px;
        }

        .reviewCard {
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 14px;
          padding: 10px 10px;
          background: rgba(249, 250, 251, 0.9);
        }

        .reviewTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 6px;
        }

        .reviewDate {
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.45);
          white-space: nowrap;
        }

        .reviewText {
          font-size: 13px;
          line-height: 1.45;
          color: rgba(17, 24, 39, 0.78);
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .reviewText.muted {
          color: rgba(17, 24, 39, 0.45);
        }

        .badgeOk {
          margin-top: 8px;
          display: inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.14);
          border: 1px solid rgba(22, 163, 74, 0.22);
          color: #166534;
          font-weight: 950;
          font-size: 12px;
        }
      `}</style>
    </main>
  );
}
