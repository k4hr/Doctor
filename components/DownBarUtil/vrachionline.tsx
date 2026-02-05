/* path: components/DownBarUtil/vrachionline.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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
};

type ApiOk = { ok: true; count: number; items: ApiDoctor[] };
type ApiErr = { ok: false; error: string; hint?: string };
type ApiResp = ApiOk | ApiErr;

type UiDoctor = ApiDoctor & { __placeholder?: boolean };

const UI_LIMIT = 7;

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

/* cookie helpers (чтобы API пускало через initData) */
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

function nameLastFirst(d: ApiDoctor) {
  const ln = String(d.lastName || '').trim();
  const fn = String(d.firstName || '').trim();
  const full = [ln, fn].filter(Boolean).join(' ').trim();
  return full || 'Врач';
}

function specLine(d: ApiDoctor) {
  const parts = [d.speciality1, d.speciality2, d.speciality3].filter(Boolean).map((x) => String(x).trim());
  return parts.length ? parts.join(', ') : '—';
}

function expLabel(d: ApiDoctor) {
  const n = typeof d.experienceYears === 'number' && Number.isFinite(d.experienceYears) ? d.experienceYears : null;
  return n != null ? `Стаж: ${n} лет` : 'Стаж: —';
}

function avatarLetter(d: ApiDoctor) {
  const ln = String(d.lastName || '').trim();
  const fn = String(d.firstName || '').trim();
  const ch = (ln || fn || 'D')[0] || 'D';
  return ch.toUpperCase();
}

function makePlaceholders(n: number): UiDoctor[] {
  return Array.from({ length: n }).map((_, i) => ({
    id: `placeholder-${i}`,
    firstName: 'Имя',
    lastName: 'Фамилия',
    middleName: null,
    speciality1: 'Специальность',
    speciality2: null,
    speciality3: null,
    experienceYears: null,
    avatarUrl: null,
    __placeholder: true,
  }));
}

/** Блок "Врачи онлайн" для доунбара (реальные данные) */
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
      setItems(list);
      setCount(typeof ok.count === 'number' ? ok.count : list.length);
    } catch {
      setItems([]);
      setCount(0);
    }
  }

  useEffect(() => {
    // ✅ window только здесь, чтобы не падал build/SSR
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

  const uiItems: UiDoctor[] = useMemo(() => {
    const list = Array.isArray(items) ? items.slice(0, UI_LIMIT) : [];
    if (list.length >= UI_LIMIT) return list;

    const need = UI_LIMIT - list.length;
    return [...list, ...makePlaceholders(need)];
  }, [items]);

  const handleDoctorClick = (d: UiDoctor) => {
    if (d.__placeholder) return;
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
          {uiItems.map((d) => (
            <button
              key={d.id}
              type="button"
              className={d.__placeholder ? 'doconline-card doconline-card--ph' : 'doconline-card'}
              onClick={() => handleDoctorClick(d)}
              disabled={d.__placeholder}
            >
              <div className="doconline-avatar" aria-label="Аватар врача">
                {d.avatarUrl && !d.__placeholder ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.avatarUrl} alt="doctor" className="doconline-avatar-img" />
                ) : (
                  <span>{avatarLetter(d)}</span>
                )}
              </div>

              <div className="doconline-main">
                <div className="doconline-name-row">
                  <span className="doconline-name" title={nameLastFirst(d)}>
                    {nameLastFirst(d)}
                  </span>
                </div>

                <span className="doconline-spec" title={specLine(d)}>
                  {specLine(d)}
                </span>

                <div className="doconline-bottom">
                  <span className="doconline-exp">{expLabel(d)}</span>
                  <span className="doconline-rating">⭐ 5.0</span>
                </div>
              </div>
            </button>
          ))}
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

        .doconline-card {
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
          min-width: 0;
          overflow: hidden;
        }

        .doconline-card:disabled {
          cursor: default;
        }

        .doconline-card--ph {
          opacity: 0.6;
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

        .doconline-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .doconline-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          overflow: hidden;
        }

        .doconline-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-width: 0;
        }

        .doconline-name {
          font-size: 14px;
          font-weight: 700;
          color: #022c22;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
          max-width: 100%;
        }

        .doconline-spec {
          font-size: 12px;
          color: rgba(15, 23, 42, 0.8);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
          max-width: 100%;
        }

        .doconline-bottom {
          margin-top: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          gap: 10px;
          min-width: 0;
        }

        .doconline-exp {
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.9);
          color: #15803d;
          font-weight: 500;
          white-space: nowrap;
          flex: 0 0 auto;
        }

        .doconline-rating {
          color: #166534;
          font-weight: 600;
          white-space: nowrap;
          flex: 0 0 auto;
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
