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

function doctorLastFirst(d: DoctorItem) {
  const ln = String(d?.lastName || '').trim();
  const fn = String(d?.firstName || '').trim();
  const full = [ln, fn].filter(Boolean).join(' ').trim();
  return full || '—';
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
    <main className="doclist">
      <TopBarBack />

      <h1 className="title">{speciality}</h1>

      {loading ? <p className="sub">Загрузка…</p> : <p className="sub">Найдено: {items.length}</p>}
      {warn ? <p className="warn">{warn}</p> : null}

      <section className="list">
        {items.map((d) => {
          const name = doctorLastFirst(d);
          const specs = doctorSpecsLine(d);
          const exp = typeof d.experienceYears === 'number' && Number.isFinite(d.experienceYears) ? d.experienceYears : null;
          const expLabel = exp !== null ? `Стаж: ${exp} лет` : 'Стаж: —';
          const ratingLabel = safeRatingLabel();

          return (
            <button
              key={d.id}
              type="button"
              className="card"
              onClick={() => router.push(`/hamburger/doctor/${d.id}`)}
            >
              <div className="head">
                <div className="avatar" aria-label="Фото врача">
                  {d.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.avatarUrl} alt="" />
                  ) : (
                    <div className="avatarPh">{doctorAvatarLetter(d)}</div>
                  )}
                </div>

                <div className="headInfo">
                  <div className="name">{name}</div>
                  <div className="specs">{specs}</div>

                  <div className="row">
                    <div className="exp">{expLabel}</div>

                    <div className="rating" aria-label="Рейтинг">
                      <span className="star">⭐</span>
                      <span>{ratingLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      <DownBar />

      <style jsx>{`
        .doclist {
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
          display: grid;
          gap: 12px;
          padding-bottom: 72px;
          width: 100%;
        }

        /* ✅ КЛЮЧЕВОЕ: кнопка по умолчанию inline/fit-content в некоторых стилях,
           поэтому принудительно делаем block + 100% и box-sizing */
        .card {
          display: block;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;

          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.08);
          text-align: left;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          padding: 0;
        }

        /* ✅ На iOS иногда помогает еще так, чтобы растянуть кнопку */
        .card {
          justify-self: stretch;
        }

        .card:active {
          transform: scale(0.995);
          opacity: 0.96;
        }

        .head {
          padding: 12px;
          background: rgba(34, 197, 94, 0.1);
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .avatar {
          width: 52px;
          height: 52px;
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #fff;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }

        .avatar img {
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
          font-size: 20px;
          color: #166534;
          background: linear-gradient(135deg, rgba(229, 231, 235, 0.9), rgba(243, 244, 246, 1));
        }

        .headInfo {
          min-width: 0;
          flex: 1 1 auto;
        }

        .name {
          font-weight: 950;
          font-size: 15px;
          color: rgba(15, 23, 42, 0.92);
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .specs {
          margin-top: 2px;
          font-size: 12px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.65);
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .row {
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .exp {
          font-size: 12px;
          font-weight: 900;
          color: rgba(15, 23, 42, 0.78);
          white-space: nowrap;
        }

        .rating {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 950;
          color: rgba(15, 23, 42, 0.8);
          white-space: nowrap;
        }

        .star {
          opacity: 0.9;
        }
      `}</style>
    </main>
  );
}
