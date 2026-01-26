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
  avatarUrl: string | null;
};

type ApiOk = { ok: true; items: DoctorItem[] };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

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

        const res = await fetch(`/api/doctors?speciality=${encodeURIComponent(speciality)}`, {
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
        {items.map((d) => (
          <button
            key={d.id}
            type="button"
            className="card"
            onClick={() => router.push(`/hamburger/doctor/${d.id}`)} // если у тебя будет такая страница
          >
            <div className="avatar">
              {d.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.avatarUrl} alt="" />
              ) : (
                <div className="avatarPh" />
              )}
            </div>

            <div className="info">
              <div className="name">
                {d.lastName} {d.firstName} {d.middleName || ''}
              </div>
              <div className="meta">
                {d.city ? d.city : 'Город не указан'}
              </div>
            </div>
          </button>
        ))}
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
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-bottom: 72px;
        }

        .card {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(156, 163, 175, 0.35);
          background: #fff;
          text-align: left;
          -webkit-tap-highlight-color: transparent;
          cursor: pointer;
        }

        .card:active {
          transform: scale(0.995);
          opacity: 0.95;
        }

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          overflow: hidden;
          background: #f3f4f6;
          flex: 0 0 44px;
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
          background: linear-gradient(135deg, #e5e7eb, #f3f4f6);
        }

        .info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .name {
          font-size: 15px;
          font-weight: 900;
          color: #111827;
          line-height: 1.2;
        }

        .meta {
          font-size: 12px;
          color: #6b7280;
        }
      `}</style>
    </main>
  );
}
