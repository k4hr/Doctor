/* path: components/DownBarUtil/vrachionline.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DoctorCard, { type DoctorAvatarCrop, type DoctorCardData } from '@/components/DoctorCard/DoctorCard';

type ApiDoctor = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  speciality1: string | null;
  speciality2: string | null;
  speciality3: string | null;
  experienceYears: number | null;
  avatarUrl: string | null;
  avatarCrop?: DoctorAvatarCrop | null;

  // ✅ рейтинг из API
  ratingSum: number;
  ratingCount: number;
};

type ApiOk = { ok: true; count: number; items: ApiDoctor[] };
type ApiErr = { ok: false; error: string; hint?: string };
type ApiResp = ApiOk | ApiErr;

const UI_LIMIT = 7;

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

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

function isRealDoctor(d: ApiDoctor) {
  const fn = String(d.firstName ?? '').trim();
  const ln = String(d.lastName ?? '').trim();
  return !!d.id && (fn.length > 0 || ln.length > 0);
}

export default function VrachiOnlineBlock() {
  const router = useRouter();

  const [initData, setInitData] = useState<string>('');
  const [items, setItems] = useState<ApiDoctor[]>([]);
  const [count, setCount] = useState<number>(0);

  async function load(idata: string) {
    try {
      const r = await fetch(`/api/doctors/online?limit=${UI_LIMIT}`, {
        method: 'GET',
        headers: idata ? { 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata } : undefined,
        cache: 'no-store',
      });

      const j = (await r.json().catch(() => null)) as ApiResp | null;
      if (!r.ok || !j || (j as any).ok !== true) {
        setItems([]);
        setCount(0);
        return;
      }

      const ok = j as ApiOk;
      const list = Array.isArray(ok.items) ? ok.items : [];
      const real = list.filter(isRealDoctor).slice(0, UI_LIMIT);

      setItems(real);

      const apiCount = typeof ok.count === 'number' ? ok.count : real.length;
      setCount(Math.max(real.length, apiCount));
    } catch {
      setItems([]);
      setCount(0);
    }
  }

  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try {
      WebApp?.ready?.();
    } catch {}

    const idata = (WebApp?.initData as string) || getInitDataFromCookie();

    if (WebApp?.initData && typeof WebApp.initData === 'string' && WebApp.initData.length > 0) {
      setCookie('tg_init_data', WebApp.initData, 3);
    }

    const finalIdata = String(idata || '');
    setInitData(finalIdata);

    load(finalIdata);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uiItems: ApiDoctor[] = useMemo(() => {
    return Array.isArray(items) ? items.slice(0, UI_LIMIT) : [];
  }, [items]);

  const handleDoctorClick = (d: ApiDoctor) => {
    haptic('light');
    router.push(`/hamburger/doctor/${encodeURIComponent(d.id)}`);
  };

  const handleAllDoctorsClick = () => {
    haptic('medium');
    router.push('/hamburger/vrachi');
  };

  return (
    <>
      <section className="doconline">
        <header className="doconline-header">
          <h2 className="doconline-title">Врачи онлайн</h2>
          <span className="doconline-counter">{count}</span>
        </header>

        <div className="doconline-list">
          {uiItems.length === 0 ? (
            <div className="doconline-empty">Сейчас нет врачей онлайн</div>
          ) : (
            uiItems.map((d) => {
              const card: DoctorCardData = {
                id: d.id,
                firstName: d.firstName,
                lastName: d.lastName,
                middleName: d.middleName,
                speciality1: d.speciality1,
                speciality2: d.speciality2,
                speciality3: d.speciality3,
                experienceYears: d.experienceYears,
                avatarUrl: d.avatarUrl,
                avatarCrop: d.avatarCrop ?? null,

                // ✅ прокидываем агрегаты в карточку
                ratingSum: typeof d.ratingSum === 'number' ? d.ratingSum : 0,
                ratingCount: typeof d.ratingCount === 'number' ? d.ratingCount : 0,
              };

              return (
                <DoctorCard
                  key={d.id}
                  doctor={card}
                  disabled={false}
                  onClick={() => handleDoctorClick(d)}
                  showRating={true}
                  // ❌ НЕ ПЕРЕДАЁМ ratingLabel="5.0"
                />
              );
            })
          )}
        </div>

        <button type="button" className="doconline-all" onClick={handleAllDoctorsClick} disabled={!initData}>
          Все врачи
        </button>
      </section>

      <style jsx>{`
        .doconline {
          margin-top: 18px;
          overflow-x: hidden;
        }

        .doconline-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          min-width: 0;
        }

        .doconline-title {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          color: #0b0c10;
        }

        .doconline-counter {
          padding: 2px 10px;
          border-radius: 999px;
          background: rgba(187, 247, 208, 0.9);
          color: #15803d;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          flex: 0 0 auto;
        }

        .doconline-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .doconline-empty {
          padding: 12px 12px;
          border-radius: 16px;
          border: 1px solid rgba(10, 12, 20, 0.08);
          background: rgba(255, 255, 255, 0.96);
          color: rgba(15, 23, 42, 0.65);
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 8px 18px rgba(18, 28, 45, 0.06);
        }

        .doconline-all {
          margin-top: 10px;
          width: 100%;
          padding: 10px 16px;
          border-radius: 999px;
          border: 1px solid rgba(34, 197, 94, 0.7);
          background: rgba(255, 255, 255, 0.96);
          color: #166534;
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 8px 18px rgba(22, 163, 74, 0.12);
        }

        .doconline-all:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .doconline-all:active {
          transform: scale(0.98);
          box-shadow: 0 5px 12px rgba(22, 163, 74, 0.2);
        }
      `}</style>
    </>
  );
}
