/* path: app/hamburger/vrachi/[speciality]/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopBarBack from '../../../../components/TopBarBack';
import DownBar from '../../../../components/DownBar';
import DoctorCard, { type DoctorCardItem } from '../../../../components/DoctorCard/DoctorCard';

type DoctorItem = DoctorCardItem;

type ApiOk = { ok: true; items: DoctorItem[] };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
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
        {items.map((d) => (
          <DoctorCard
            key={d.id}
            doctor={d}
            showRating={true}
            showOnlineDot={false}
            onClick={(doc) => {
              haptic('light');
              router.push(`/hamburger/doctor/${doc.id}`);
            }}
          />
        ))}
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
      `}</style>
    </main>
  );
}
