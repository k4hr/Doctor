/* path: app/hamburger/doctor/[id]/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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

type PublicDoctorDto = {
  id: string;
  status: string;

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
  };
};

type PublicDoctorOk = { ok: true; doctor: PublicDoctorDto };
type PublicDoctorErr = { ok: false; error: string; hint?: string };
type PublicDoctorResp = PublicDoctorOk | PublicDoctorErr;

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

/** PRO gate from settings endpoint */
type GateOk = {
  ok: true;
  proActive: boolean;
  consultationEnabled: boolean;
  consultationPriceRub: number;
  thanksEnabled: boolean;
  proUntil: string | null;
};
type GateErr = { ok: false; error: string; hint?: string };
type GateResp = GateOk | GateErr;

function fullName(d: PublicDoctorDto | null) {
  const a = String(d?.lastName ?? '').trim();
  const b = String(d?.firstName ?? '').trim();
  const c = String(d?.middleName ?? '').trim();
  return [a, b, c].filter(Boolean).join(' ').trim() || '—';
}

function specsLine(d: PublicDoctorDto | null) {
  const parts = [d?.speciality1, d?.speciality2, d?.speciality3].filter(Boolean).map((x) => String(x).trim());
  return parts.length ? parts.join(', ') : '—';
}

function avatarLetter(d: PublicDoctorDto | null) {
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
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
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

export default function DoctorPublicProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();

  const doctorId = useMemo(() => String(params?.id || '').trim(), [params]);

  const [initData, setInitData] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');
  const [doctor, setDoctor] = useState<PublicDoctorDto | null>(null);

  const [tab, setTab] = useState<'about' | 'reviews'>(() => {
    const t = String(sp?.get('tab') || '').toLowerCase();
    return t === 'reviews' ? 'reviews' : 'about';
  });

  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsWarn, setReviewsWarn] = useState('');
  const [reviewsItems, setReviewsItems] = useState<ReviewItem[]>([]);
  const [ratingAvg, setRatingAvg] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  // ✅ gate (PRO)
  const [gateLoading, setGateLoading] = useState(true);
  const [proActive, setProActive] = useState(false);
  const [consultationEnabled, setConsultationEnabled] = useState(false);
  const [consultationPriceRub, setConsultationPriceRub] = useState<number>(1000);
  const [thanksEnabled, setThanksEnabled] = useState(false);

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
  }, []);

  // грузим публичные данные врача
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setWarn('');
        setDoctor(null);

        if (!doctorId) {
          setWarn('Нет doctorId');
          return;
        }

        const r = await fetch(`/api/doctor/public?doctorId=${encodeURIComponent(doctorId)}`, {
          method: 'GET',
          cache: 'no-store',
        });

        const j = (await r.json().catch(() => null)) as PublicDoctorResp | null;

        if (!r.ok || !j || (j as any).ok !== true) {
          setWarn((j as any)?.hint || (j as any)?.error || 'Не удалось загрузить профиль врача');
          setDoctor(null);
          return;
        }

        setDoctor((j as PublicDoctorOk).doctor);
      } catch (e) {
        console.error(e);
        setWarn('Ошибка сети/сервера');
        setDoctor(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [doctorId]);

  // ✅ грузим gate (PRO) — именно он решает, показывать ли кнопки
  useEffect(() => {
    (async () => {
      try {
        setGateLoading(true);

        // initData может не быть (если открыли не из телеги) — тогда считаем, что PRO нет и прячем кнопки
        if (!doctorId || !initData) {
          setProActive(false);
          setConsultationEnabled(false);
          setConsultationPriceRub(1000);
          setThanksEnabled(false);
          return;
        }

        const r = await fetch('/api/doctor/consultations/settings', {
          method: 'GET',
          headers: { 'X-Telegram-Init-Data': initData, 'X-Init-Data': initData },
          cache: 'no-store',
        });

        const j = (await r.json().catch(() => null)) as GateResp | null;

        if (!r.ok || !j || (j as any).ok !== true) {
          setProActive(false);
          setConsultationEnabled(false);
          setConsultationPriceRub(1000);
          setThanksEnabled(false);
          return;
        }

        const ok = j as GateOk;
        setProActive(Boolean(ok.proActive));
        setConsultationEnabled(Boolean(ok.consultationEnabled));
        setConsultationPriceRub(Math.max(1000, Math.round(Number(ok.consultationPriceRub || 1000))));
        setThanksEnabled(Boolean(ok.thanksEnabled));
      } catch (e) {
        console.error(e);
        setProActive(false);
        setConsultationEnabled(false);
        setConsultationPriceRub(1000);
        setThanksEnabled(false);
      } finally {
        setGateLoading(false);
      }
    })();
  }, [doctorId, initData]);

  // грузим отзывы
  useEffect(() => {
    (async () => {
      try {
        if (!doctorId) return;

        setReviewsLoading(true);
        setReviewsWarn('');

        const headers: Record<string, string> = {};
        if (initData) {
          headers['X-Telegram-Init-Data'] = initData;
          headers['X-Init-Data'] = initData;
        }

        const r = await fetch(`/api/doctor/reviews?doctorId=${encodeURIComponent(doctorId)}&limit=50`, {
          method: 'GET',
          headers,
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
  }, [doctorId, initData]);

  const name = useMemo(() => (loading ? '...' : fullName(doctor)), [doctor, loading]);
  const specs = useMemo(() => specsLine(doctor), [doctor]);

  const expYears = doctor?.experienceYears ?? null;
  const consults = doctor?.stats?.consultationsCount ?? 0;

  const ratingLabel = useMemo(() => fmtRating(ratingAvg), [ratingAvg]);
  const starsValue = useMemo(() => {
    const v = typeof ratingAvg === 'number' && Number.isFinite(ratingAvg) ? ratingAvg : 0;
    return Math.max(0, Math.min(5, v));
  }, [ratingAvg]);

  function onConsultation() {
    haptic('medium');
    if (!doctorId) return;
    router.push(`/consultations?doctorId=${encodeURIComponent(doctorId)}`);
  }

  function onThanks() {
    haptic('light');
    if (!doctorId) return;
    router.push(`/thanks?doctorId=${encodeURIComponent(doctorId)}`);
  }

  const showActions = !gateLoading && proActive; // ✅ прячем полностью, если PRO нет

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
          <Stars value={starsValue} />
        </div>

        <div className="ratingText">
          Рейтинг: <b>{ratingLabel}</b> <span className="ratingCount">({formatInt(ratingCount)})</span>
        </div>
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
          <div className="statVal">{formatInt(ratingCount)}</div>
          <div className="statLab">отзывов</div>
        </div>
      </section>

      {/* ✅ Кнопки ТОЛЬКО если PRO активен */}
      {showActions ? (
        <section className="actions" aria-label="Действия">
          <button
            type="button"
            className={'actionBtn actionBtn--consult ' + (!consultationEnabled ? 'actionBtn--disabled' : '')}
            onClick={onConsultation}
            disabled={!consultationEnabled}
          >
            <span className="ic" aria-hidden="true">
              💬
            </span>
            <span className="tx">
              <span className="txT">Консультация</span>
              <span className="txS">
                {consultationEnabled ? (
                  <>
                    от <b>{Math.max(1000, consultationPriceRub)} ₽</b>
                  </>
                ) : (
                  <>временно выключено</>
                )}
              </span>
            </span>
            <span className="go" aria-hidden="true">
              →
            </span>
          </button>

          {thanksEnabled ? (
            <button type="button" className="actionBtn actionBtn--thanks" onClick={onThanks}>
              <span className="ic" aria-hidden="true">
                ❤️
              </span>
              <span className="tx">
                <span className="txT">Благодарность</span>
                <span className="txS">поддержать врача деньгами</span>
              </span>
              <span className="go" aria-hidden="true">
                →
              </span>
            </button>
          ) : null}
        </section>
      ) : null}

      {warn ? <p className="warn">{warn}</p> : null}
      {loading ? <p className="muted">Загрузка…</p> : null}
      {!loading && !doctor && !warn ? <p className="muted">Врач не найден.</p> : null}

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

        /* ✅ ACTIONS (sexy buttons) */
        .actions {
          margin-top: 10px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .actionBtn {
          width: 100%;
          border: 1px solid rgba(15, 23, 42, 0.10);
          border-radius: 18px;
          padding: 12px 12px;
          background: rgba(255, 255, 255, 0.92);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          display: grid;
          grid-template-columns: 34px 1fr 20px;
          align-items: center;
          gap: 10px;

          box-shadow: 0 12px 26px rgba(18, 28, 45, 0.08);
          transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;
        }

        .actionBtn:active {
          transform: translateY(1px) scale(0.995);
          box-shadow: 0 8px 18px rgba(18, 28, 45, 0.12);
        }

        .ic {
          width: 34px;
          height: 34px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 18px;
          font-weight: 900;
          background: rgba(17, 24, 39, 0.06);
          border: 1px solid rgba(17, 24, 39, 0.08);
        }

        .tx {
          min-width: 0;
          display: grid;
          gap: 2px;
          text-align: left;
        }

        .txT {
          font-size: 15px;
          font-weight: 950;
          color: #111827;
          letter-spacing: -0.01em;
        }

        .txS {
          font-size: 12px;
          font-weight: 850;
          color: rgba(17, 24, 39, 0.55);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .go {
          justify-self: end;
          font-size: 18px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.35);
        }

        .actionBtn--consult {
          background: linear-gradient(135deg, rgba(36, 199, 104, 0.18), rgba(255, 255, 255, 0.92));
          border-color: rgba(36, 199, 104, 0.20);
        }
        .actionBtn--consult .ic {
          background: rgba(36, 199, 104, 0.14);
          border-color: rgba(36, 199, 104, 0.20);
        }

        .actionBtn--thanks {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.14), rgba(255, 255, 255, 0.92));
          border-color: rgba(239, 68, 68, 0.18);
        }
        .actionBtn--thanks .ic {
          background: rgba(239, 68, 68, 0.10);
          border-color: rgba(239, 68, 68, 0.18);
        }

        .actionBtn--disabled {
          filter: grayscale(0.2);
        }

        .actionBtn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          box-shadow: none;
        }
        .actionBtn:disabled:active {
          transform: none;
        }

        .warn {
          margin: 10px 0 0;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
          font-weight: 700;
        }

        .warnSmall {
          margin: 0 0 8px;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
          font-weight: 800;
        }

        .muted {
          margin: 10px 0 0;
          font-size: 13px;
          color: rgba(17, 24, 39, 0.55);
          font-weight: 800;
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
