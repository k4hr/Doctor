/* path: app/hamburger/profile/admin/doctor/pro/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import TopBarBack from '../../../../../../components/TopBarBack';

function tg(): any | null {
  try {
    return (window as any)?.Telegram?.WebApp || null;
  } catch {
    return null;
  }
}

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    tg()?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

function tgAlert(msg: string) {
  try {
    tg()?.showAlert?.(msg);
    return;
  } catch {}
  alert(msg);
}

/* cookie helpers (чтобы админка работала стабильнее в Safari/iOS) */
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

function getInitData(): string {
  const WebApp: any = tg();
  const idata = (WebApp?.initData as string) || getCookie('tg_init_data') || '';
  if (WebApp?.initData && typeof WebApp.initData === 'string' && WebApp.initData.length > 0) {
    setCookie('tg_init_data', WebApp.initData, 3);
  }
  return String(idata || '').trim();
}

type DoctorItem = {
  id: string;
  status: string;

  telegramId: string;
  telegramUsername: string | null;
  telegramFirstName: string | null;
  telegramLastName: string | null;

  firstName: string;
  lastName: string;
  middleName: string | null;

  speciality1: string | null;
  city: string | null;

  proUntil: string | null; // ISO
  consultationEnabled: boolean;
  consultationPriceRub: number;
  thanksEnabled: boolean;

  avatarUrl: string | null;
};

type SearchOk = { ok: true; items: DoctorItem[] };
type SearchErr = { ok: false; error: string; hint?: string };
type SearchResp = SearchOk | SearchErr;

type Plan = 'M1' | 'M3' | 'M6' | 'Y1';

type GrantOk = { ok: true; doctorId: string; proUntil: string; plan: Plan };
type GrantErr = { ok: false; error: string; hint?: string };
type GrantResp = GrantOk | GrantErr;

function fullName(d: DoctorItem) {
  const a = String(d.lastName || '').trim();
  const b = String(d.firstName || '').trim();
  const c = String(d.middleName || '').trim();
  return [a, b, c].filter(Boolean).join(' ').trim();
}

function fmtDateRu(iso: string) {
  try {
    const dt = new Date(iso);
    const ts = dt.getTime();
    if (!Number.isFinite(ts)) return iso;
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dt);
  } catch {
    return iso;
  }
}

function planLabel(p: Plan) {
  if (p === 'M1') return '1 месяц';
  if (p === 'M3') return '3 месяца';
  if (p === 'M6') return '6 месяцев';
  return '1 год';
}

export default function AdminDoctorProPage() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [warn, setWarn] = useState('');
  const [items, setItems] = useState<DoctorItem[]>([]);
  const [plan, setPlan] = useState<Plan>('M1');
  const [grantLoadingId, setGrantLoadingId] = useState<string>('');

  useEffect(() => {
    try {
      tg()?.ready?.();
      tg()?.expand?.();
    } catch {}
  }, []);

  const canSearch = useMemo(() => q.trim().length >= 2, [q]);

  async function onSearch() {
    haptic('light');
    setWarn('');
    const query = q.trim();
    if (query.length < 2) {
      setWarn('Введи минимум 2 символа (id/telegramId/ФИО).');
      return;
    }

    const initData = getInitData();
    if (!initData) {
      setWarn('NO_INIT_DATA');
      tgAlert('Открой админку через Telegram (initData обязателен).');
      return;
    }

    setLoading(true);
    try {
      const r = await fetch(`/api/admin/doctors/search?q=${encodeURIComponent(query)}&limit=30`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'X-Telegram-Init-Data': initData,
          'X-Init-Data': initData,
        },
      });

      const j = (await r.json().catch(() => null)) as SearchResp | null;
      if (!r.ok || !j || (j as any).ok !== true) {
        setItems([]);
        setWarn((j as any)?.hint || (j as any)?.error || 'Не удалось выполнить поиск');
        return;
      }

      setItems((j as SearchOk).items || []);
      if (!(j as SearchOk).items?.length) setWarn('Ничего не найдено.');
    } catch (e: any) {
      setItems([]);
      setWarn(String(e?.message || 'Сеть/сервер недоступны'));
    } finally {
      setLoading(false);
    }
  }

  async function grantPro(doctorId: string) {
    haptic('medium');
    setWarn('');
    setGrantLoadingId(doctorId);

    const initData = getInitData();
    if (!initData) {
      setWarn('NO_INIT_DATA');
      tgAlert('Открой админку через Telegram (initData обязателен).');
      setGrantLoadingId('');
      return;
    }

    try {
      const r = await fetch('/api/admin/doctor/pro/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData,
          'X-Init-Data': initData,
        },
        cache: 'no-store',
        body: JSON.stringify({ doctorId, plan }),
      });

      const j = (await r.json().catch(() => null)) as GrantResp | null;
      if (!r.ok || !j || (j as any).ok !== true) {
        const msg = (j as any)?.hint || (j as any)?.error || 'Не удалось выдать PRO';
        setWarn(String(msg));
        return;
      }

      tgAlert(`PRO выдан до ${fmtDateRu((j as GrantOk).proUntil)} (${planLabel((j as GrantOk).plan)})`);

      setItems((prev) =>
        prev.map((x) =>
          x.id === doctorId
            ? {
                ...x,
                proUntil: (j as GrantOk).proUntil,
                consultationEnabled: true,
                thanksEnabled: true,
              }
            : x
        )
      );
    } catch (e: any) {
      setWarn(String(e?.message || 'Сеть/сервер недоступны'));
    } finally {
      setGrantLoadingId('');
    }
  }

  return (
    <main className="wrap">
      <TopBarBack />
      <h1 className="title">Выдать PRO</h1>
      <p className="sub">Поиск врача и выдача PRO (открывает консультации и благодарности).</p>

      <section className="card">
        <div className="row">
          <input
            className="inp"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="doctorId / telegramId / ФИО"
            maxLength={120}
          />
          <button type="button" className="btn" onClick={onSearch} disabled={loading || !canSearch}>
            {loading ? 'Ищем…' : 'Найти'}
          </button>
        </div>

        <div className="row2">
          <div className="lab">План PRO:</div>
          <div className="plans">
            {(['M1', 'M3', 'M6', 'Y1'] as Plan[]).map((p) => (
              <button
                key={p}
                type="button"
                className={plan === p ? 'pill pillActive' : 'pill'}
                onClick={() => {
                  haptic('light');
                  setPlan(p);
                }}
              >
                {planLabel(p)}
              </button>
            ))}
          </div>
        </div>

        {warn ? <div className="warn">{warn}</div> : null}
      </section>

      <section className="list">
        {items.map((d) => (
          <div key={d.id} className="doc">
            <div className="top">
              <div className="ava">
                {d.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="avaImg" src={d.avatarUrl} alt="" />
                ) : (
                  <div className="avaPh">{(d.lastName?.[0] || d.firstName?.[0] || 'D').toUpperCase()}</div>
                )}
              </div>

              <div className="info">
                <div className="name">{fullName(d)}</div>
                <div className="meta">
                  <span className="chip">{String(d.status || '—')}</span>
                  <span className="dot">·</span>
                  <span className="metaText">
                    tg:{d.telegramId}
                    {d.telegramUsername ? ` (@${d.telegramUsername})` : ''}
                  </span>
                </div>

                <div className="meta2">
                  <span className="metaText">{d.speciality1 || '—'}</span>
                  <span className="dot">·</span>
                  <span className="metaText">{d.city || '—'}</span>
                </div>

                <div className="meta3">
                  <span className={d.proUntil ? 'proOn' : 'proOff'}>
                    PRO: {d.proUntil ? `до ${fmtDateRu(d.proUntil)}` : 'нет'}
                  </span>
                  <span className="dot">·</span>
                  <span className="metaText">
                    consultations: {d.consultationEnabled ? 'ON' : 'OFF'} · {d.consultationPriceRub} ₽
                  </span>
                  <span className="dot">·</span>
                  <span className="metaText">thanks: {d.thanksEnabled ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            </div>

            <div className="actions">
              <button
                type="button"
                className="grant"
                onClick={() => grantPro(d.id)}
                disabled={grantLoadingId === d.id}
              >
                {grantLoadingId === d.id ? 'Выдаём…' : `Выдать PRO (${planLabel(plan)})`}
              </button>
            </div>
          </div>
        ))}

        {!items.length ? <div className="empty">Тут появятся найденные врачи.</div> : null}
      </section>

      <style jsx>{`
        .wrap {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          background: #f6f7fb;
        }

        .title {
          margin: 6px 0 0;
          font-size: 24px;
          font-weight: 950;
          color: #111827;
        }

        .sub {
          margin: 6px 0 12px;
          font-size: 13px;
          color: rgba(17, 24, 39, 0.65);
          font-weight: 800;
          line-height: 1.35;
        }

        .card {
          background: #fff;
          border-radius: 18px;
          padding: 12px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .row {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .inp {
          flex: 1;
          height: 44px;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(249, 250, 251, 1);
          padding: 0 12px;
          font-size: 14px;
          font-weight: 800;
          color: #111827;
          outline: none;
        }

        .btn {
          height: 44px;
          padding: 0 14px;
          border-radius: 14px;
          border: none;
          background: #6d28d9;
          color: #fff;
          font-size: 14px;
          font-weight: 950;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .row2 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .lab {
          font-size: 12px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.7);
        }

        .plans {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .pill {
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          font-size: 12px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.78);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .pillActive {
          background: rgba(109, 40, 217, 0.1);
          border-color: rgba(109, 40, 217, 0.35);
          color: #6d28d9;
        }

        .warn {
          font-size: 12px;
          font-weight: 900;
          color: #ef4444;
          overflow-wrap: anywhere;
        }

        .list {
          margin-top: 12px;
          display: grid;
          gap: 10px;
        }

        .doc {
          background: #fff;
          border-radius: 18px;
          padding: 12px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.04);
        }

        .top {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .ava {
          width: 56px;
          height: 56px;
          border-radius: 999px;
          overflow: hidden;
          background: #f3f4f6;
          border: 1px solid rgba(15, 23, 42, 0.08);
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }

        .avaImg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .avaPh {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          font-weight: 950;
          font-size: 20px;
          color: #111827;
          background: linear-gradient(135deg, rgba(229, 231, 235, 0.9), rgba(243, 244, 246, 1));
        }

        .info {
          flex: 1;
          min-width: 0;
        }

        .name {
          font-size: 15px;
          font-weight: 950;
          color: #111827;
          line-height: 1.2;
        }

        .meta,
        .meta2,
        .meta3 {
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(17, 24, 39, 0.06);
          border: 1px solid rgba(17, 24, 39, 0.08);
          font-size: 11px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.7);
        }

        .dot {
          color: rgba(17, 24, 39, 0.35);
          font-weight: 900;
        }

        .metaText {
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.65);
          overflow-wrap: anywhere;
        }

        .proOn {
          font-size: 12px;
          font-weight: 950;
          color: #6d28d9;
        }

        .proOff {
          font-size: 12px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.55);
        }

        .actions {
          margin-top: 10px;
          display: flex;
          gap: 10px;
        }

        .grant {
          width: 100%;
          border: none;
          border-radius: 16px;
          padding: 12px 12px;
          font-size: 14px;
          font-weight: 950;
          color: #fff;
          cursor: pointer;
          background: #24c768;
          box-shadow: 0 10px 20px rgba(36, 199, 104, 0.35);
          -webkit-tap-highlight-color: transparent;
        }

        .grant:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }

        .empty {
          padding: 12px;
          text-align: center;
          font-size: 13px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.55);
        }
      `}</style>
    </main>
  );
}
