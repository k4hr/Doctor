/* path: app/hamburger/vrachi/[speciality]/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopBarBack from '../../../../components/TopBarBack';
import DownBar from '../../../../components/DownBar';

type DoctorItem = {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  city: string | null;
  speciality1: string;
  speciality2: string | null;
  speciality3: string | null;
  experienceYears: number | null;
  avatarUrl: string | null;
};

type ApiOk = { ok: true; items: DoctorItem[] };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

function doctorFullName(d: DoctorItem) {
  const ln = String(d?.lastName || '').trim();
  const fn = String(d?.firstName || '').trim();
  const mn = String(d?.middleName || '').trim();
  return [ln, fn, mn].filter(Boolean).join(' ').trim() || '—';
}

function doctorSpecsLine(d: DoctorItem) {
  const parts = [d?.speciality1, d?.speciality2, d?.speciality3].filter(Boolean).map((x) => String(x).trim());
  return parts.length ? parts.join(', ') : '—';
}

function doctorAvatarLetter(d: DoctorItem) {
  const n = String(d?.lastName || d?.firstName || 'D').trim();
  return (n[0] || 'D').toUpperCase();
}

function safeRatingLabel() {
  return '5.0';
}

export default function DoctorsBySpecialityPage() {
  const router = useRouter();
  const params = useParams<{ speciality: string }>();

  const speciality = useMemo(() => {
    const raw = params?.speciality ? String(params.speciality) : '';
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [params]);

  const [items, setItems] = useState<DoctorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setWarn('');

        const res = await fetch(`/api/doctor/vrachi?speciality=${encodeURIComponent(speciality)}`, {
          method: 'GET',
          cache: 'no-store',
        });

        const j = (await res.json().catch(() => null)) as ApiResp | null;

        if (!res.ok || !j || (j as any).ok !== true) {
          setWarn((j as any)?.error || 'Не удалось загрузить врачей');
          setItems([]);
          return;
        }

        setItems((j as ApiOk).items || []);
      } catch (e) {
        console.error(e);
        setWarn('Ошибка сети/сервера');
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [speciality]);

  return (
    <main className="page">
      <TopBarBack />

      <h1 className="title">{speciality}</h1>

      {loading ? <p className="sub">Загрузка…</p> : <p className="sub">Найдено: {items.length}</p>}
      {warn ? <p className="warn">{warn}</p> : null}

      <section className="list">
        {items.map((d) => {
          const name = doctorFullName(d);
          const spec = doctorSpecsLine(d);

          const exp =
            typeof d.experienceYears === 'number' && Number.isFinite(d.experienceYears) ? d.experienceYears : null;
          const expLabel = exp !== null ? `Стаж: ${exp} лет` : 'Стаж: —';

          const ratingLabel = safeRatingLabel();

          return (
            <button
              key={d.id}
              type="button"
              className="doconline-card"
              onClick={() => {
                haptic('light');
                router.push(`/hamburger/doctor/${d.id}`);
              }}
            >
              <div className="doconline-avatar" aria-label="Фото врача">
                {d.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.avatarUrl} alt="" />
                ) : (
                  <span>{doctorAvatarLetter(d)}</span>
                )}
              </div>

              <div className="doconline-main">
                <div className="doconline-name-row">
                  <span className="doconline-name">{name}</span>
                  <span className="doconline-dot" />
                </div>

                <span className="doconline-spec">{spec}</span>

                <div className="doconline-bottom">
                  <span className="doconline-exp">{expLabel}</span>
                  <span className="doconline-rating">⭐ {ratingLabel}</span>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      <DownBar />

      <style jsx>{`
        .page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        .title {
          margin: 6px 0 0;
          font-size: 22px;
          font-weight: 900;
          color: #111827;
        }

        .sub {
          margin: 6px 0 10px;
          font-size: 13px;
          color: #6b7280;
        }

        .warn {
          margin: 0 0 12px;
          font-size: 12px;
          color: #ef4444;
          font-weight: 700;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-bottom: 72px;
          width: 100%;
        }

        /* ====== ТОЧНО КАК В "ВРАЧИ ОНЛАЙН" ====== */

        .doconline-card {
          width: 100%;
          box-sizing: border-box;

          padding: 10px 12px;
          border-radius: 16px;
          border: 1px solid rgba(34, 197, 94, 0.22);
          background: rgba(220, 252, 231, 0.75);
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.16);

          display: flex;
          align-items: center;
          gap: 10px;

          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          text-align: left;
        }

        .doconline-card:active {
          transform: translateY(1px);
          box-shadow: 0 6px 16px rgba(22, 163, 74, 0.24);
        }

        .doconline-avatar {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: #ffffff;

          display: flex;
          align-items: center;
          justify-content: center;

          font-weight: 700;
          font-size: 18px;
          color: #16a34a;

          box-shadow: 0 4px 10px rgba(22, 163, 74, 0.3);
          flex-shrink: 0;
          overflow: hidden;
        }

        .doconline-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .doconline-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .doconline-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .doconline-name {
          font-size: 14px;
          font-weight: 700;
          color: #022c22;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .doconline-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.35);
          flex-shrink: 0;
        }

        .doconline-spec {
          font-size: 12px;
          color: rgba(15, 23, 42, 0.8);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .doconline-bottom {
          margin-top: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          gap: 10px;
        }

        .doconline-exp {
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.9);
          color: #15803d;
          font-weight: 500;
          white-space: nowrap;
        }

        .doconline-rating {
          color: #166534;
          font-weight: 600;
          white-space: nowrap;
        }
      `}</style>
    </main>
  );
}
