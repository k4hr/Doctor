'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../../../components/TopBarBack';

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

type TxItem = {
  id: string;
  createdAt: string;
  type: 'IN' | 'OUT';
  amountRub: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELED';
  title: string | null;
};
type TxOk = { ok: true; doctorId: string; items: TxItem[] };
type TxErr = { ok: false; error: string; hint?: string };
type TxResp = TxOk | TxErr;

function fmtMoneyRub(v: any) {
  const n = typeof v === 'number' ? v : Number(v);
  const x = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(x);
}

function fmtDateTimeRu(iso: string) {
  try {
    const d = new Date(iso);
    const ts = d.getTime();
    if (!Number.isFinite(ts)) return '—';
    const date = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
    const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
    return `${date} · ${time}`;
  } catch {
    return '—';
  }
}

function statusRu(s: string) {
  const v = String(s || '').toUpperCase().trim();
  if (v === 'SUCCESS') return 'успешно';
  if (v === 'PENDING') return 'в обработке';
  if (v === 'FAILED') return 'ошибка';
  if (v === 'CANCELED') return 'отменено';
  return v || '—';
}

export default function DoctorOperationsPage() {
  const router = useRouter();

  const [initData, setInitData] = useState('');
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');

  const [txTab, setTxTab] = useState<'in' | 'out'>('in');
  const [items, setItems] = useState<TxItem[]>([]);

  const tabLabel = useMemo(() => (txTab === 'in' ? 'Поступления' : 'Списания/выводы'), [txTab]);

  async function loadTx(idata: string, ttab: 'in' | 'out') {
    const type = ttab === 'in' ? 'IN' : 'OUT';
    const r = await fetch(`/api/doctor/transactions?type=${encodeURIComponent(type)}&limit=500`, {
      method: 'GET',
      headers: { 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
      cache: 'no-store',
    });

    const j = (await r.json().catch(() => null)) as TxResp | null;

    if (!r.ok || !j || (j as any).ok !== true) {
      const msg = (j as any)?.hint || (j as any)?.error || 'Не удалось загрузить операции';
      throw new Error(msg);
    }

    setItems((j as TxOk).items || []);
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
    setInitData(idata || '');

    (async () => {
      try {
        setLoading(true);
        setWarn('');

        if (!idata) {
          setWarn('Нет initData от Telegram. Открой из бота.');
          router.replace('/hamburger/profile');
          return;
        }

        await loadTx(idata, txTab);
      } catch (e: any) {
        console.error(e);
        setWarn(String(e?.message || 'Ошибка загрузки операций'));
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    (async () => {
      if (!initData) return;
      try {
        setLoading(true);
        setWarn('');
        await loadTx(initData, txTab);
      } catch (e: any) {
        console.error(e);
        setWarn(String(e?.message || 'Ошибка загрузки операций'));
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txTab]);

  async function refresh() {
    haptic('light');
    if (!initData) return;
    try {
      setLoading(true);
      setWarn('');
      await loadTx(initData, txTab);
    } catch (e: any) {
      console.error(e);
      setWarn(String(e?.message || 'Ошибка обновления'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <TopBarBack />

      <div className="wrap">
        <div className="head">
          <div>
            <div className="title">История операций</div>
            <div className="sub">{loading ? 'Загрузка…' : tabLabel}</div>
          </div>
          <button type="button" className="linkBtn" onClick={refresh} disabled={loading}>
            Обновить
          </button>
        </div>

        <div className="subtabs">
          <button
            type="button"
            className={txTab === 'in' ? 'subtab subtabActive' : 'subtab'}
            onClick={() => {
              haptic('light');
              setTxTab('in');
            }}
          >
            Поступления
          </button>
          <button
            type="button"
            className={txTab === 'out' ? 'subtab subtabActive' : 'subtab'}
            onClick={() => {
              haptic('light');
              setTxTab('out');
            }}
          >
            Выводы
          </button>
        </div>

        {warn ? <div className="warn">{warn}</div> : null}
        {loading ? <div className="muted">Загрузка…</div> : null}
        {!loading && items.length === 0 ? <div className="muted">Пока операций нет.</div> : null}

        <div className="txList">
          {items.map((t) => (
            <div key={t.id} className="tx">
              <div className="txTop">
                <div className="txTitle">{t.title || (t.type === 'IN' ? 'Поступление' : 'Вывод')}</div>
                <div className="txAmount">{t.type === 'OUT' ? `− ${fmtMoneyRub(t.amountRub)}` : fmtMoneyRub(t.amountRub)}</div>
              </div>
              <div className="txBottom">
                <div className="txDate">{fmtDateTimeRu(t.createdAt)}</div>
                <div className="txStatus">{statusRu(t.status)}</div>
              </div>
            </div>
          ))}
        </div>
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
        .head {
          margin-top: 6px;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
        }
        .title {
          font-size: 22px;
          font-weight: 950;
          color: #111827;
        }
        .sub {
          margin-top: 4px;
          font-size: 13px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.6);
        }
        .linkBtn {
          border: none;
          background: transparent;
          color: #6d28d9;
          font-weight: 950;
          font-size: 13px;
          text-decoration: underline;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .linkBtn:disabled {
          opacity: 0.6;
          cursor: default;
          text-decoration: none;
        }
        .subtabs {
          margin-top: 10px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .subtab {
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          color: rgba(17, 24, 39, 0.7);
          border-radius: 14px;
          padding: 12px;
          font-weight: 950;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.04);
        }
        .subtabActive {
          background: rgba(109, 40, 217, 0.12);
          border-color: rgba(109, 40, 217, 0.25);
          color: #6d28d9;
        }
        .warn {
          margin-top: 10px;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
          font-weight: 800;
        }
        .muted {
          margin-top: 10px;
          font-size: 13px;
          color: rgba(17, 24, 39, 0.55);
          font-weight: 800;
        }
        .txList {
          margin-top: 12px;
          display: grid;
          gap: 10px;
        }
        .tx {
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #fff;
          border-radius: 16px;
          padding: 12px;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.04);
        }
        .txTop {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: baseline;
        }
        .txTitle {
          font-size: 13px;
          font-weight: 950;
          color: #111827;
        }
        .txAmount {
          font-size: 13px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.85);
          white-space: nowrap;
        }
        .txBottom {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
        }
        .txDate {
          font-size: 11px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.45);
          white-space: nowrap;
        }
        .txStatus {
          font-size: 11px;
          font-weight: 950;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: rgba(15, 23, 42, 0.03);
          color: rgba(17, 24, 39, 0.7);
          white-space: nowrap;
          text-transform: lowercase;
        }
      `}</style>
    </main>
  );
}
