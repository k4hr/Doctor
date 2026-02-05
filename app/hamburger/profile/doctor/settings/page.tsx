/* path: app/hamburger/profile/doctor/settings/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../../components/TopBarBack';

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

/* API types */
type BalanceOk = { ok: true; doctorId: string; balanceRub: number; pendingRub: number };
type BalanceErr = { ok: false; error: string; hint?: string };
type BalanceResp = BalanceOk | BalanceErr;

type OnlineOk = { ok: true; doctorId: string; isOnline: boolean };
type OnlineErr = { ok: false; error: string; hint?: string };
type OnlineResp = OnlineOk | OnlineErr;

function fmtMoneyRub(v: any) {
  const n = typeof v === 'number' ? v : Number(v);
  const x = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(x);
}

function clampInt(x: any, min = 0, max = 10_000_000) {
  const n = typeof x === 'number' ? x : Number(x);
  if (!Number.isFinite(n)) return min;
  const v = Math.trunc(n);
  return Math.min(max, Math.max(min, v));
}

export default function DoctorSettingsHomePage() {
  const router = useRouter();

  const [initData, setInitData] = useState('');
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');

  const [doctorId, setDoctorId] = useState<string>('');
  const [balanceRub, setBalanceRub] = useState(0);
  const [pendingRub, setPendingRub] = useState(0);

  const [onlineLoading, setOnlineLoading] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(false);

  const totalRub = useMemo(
    () => clampInt(balanceRub, 0, 10_000_000) + clampInt(pendingRub, 0, 10_000_000),
    [balanceRub, pendingRub]
  );

  const helloLine = useMemo(() => {
    if (loading) return 'Загрузка…';
    if (doctorId) return `Врач #${doctorId.slice(0, 6)}`;
    return 'Врач';
  }, [doctorId, loading]);

  async function loadBalance(idata: string) {
    const r = await fetch('/api/doctor/balance', {
      method: 'GET',
      headers: { 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
      cache: 'no-store',
    });

    const j = (await r.json().catch(() => null)) as BalanceResp | null;

    if (!r.ok || !j || (j as any).ok !== true) {
      const msg = (j as any)?.hint || (j as any)?.error || 'Нет доступа к кабинету';
      throw new Error(msg);
    }

    const ok = j as BalanceOk;
    setDoctorId(ok.doctorId);
    setBalanceRub(ok.balanceRub || 0);
    setPendingRub(ok.pendingRub || 0);
  }

  async function loadOnline(idata: string) {
    const r = await fetch('/api/doctor/online', {
      method: 'GET',
      headers: { 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
      cache: 'no-store',
    });

    const j = (await r.json().catch(() => null)) as OnlineResp | null;

    if (!r.ok || !j || (j as any).ok !== true) {
      return;
    }

    setIsOnline(!!(j as OnlineOk).isOnline);
  }

  async function setOnline(idata: string, v: boolean) {
    setOnlineLoading(true);
    setWarn('');
    try {
      const r = await fetch('/api/doctor/online', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': idata,
          'X-Init-Data': idata,
        },
        body: JSON.stringify({ isOnline: v }),
      });

      const j = (await r.json().catch(() => null)) as OnlineResp | null;

      if (!r.ok || !j || (j as any).ok !== true) {
        const msg = (j as any)?.hint || (j as any)?.error || 'Не удалось сохранить статус';
        setWarn(String(msg));
        await loadOnline(idata);
        return;
      }

      setIsOnline(!!(j as OnlineOk).isOnline);
    } catch (e: any) {
      setWarn(String(e?.message || 'Ошибка сети при сохранении статуса'));
      await loadOnline(idata);
    } finally {
      setOnlineLoading(false);
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

        await loadBalance(idata);
        await loadOnline(idata);
      } catch (e: any) {
        console.error(e);
        setWarn(String(e?.message || 'Ошибка проверки доступа'));
        router.replace('/hamburger/profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function onRefresh() {
    haptic('light');
    if (!initData) return;
    try {
      setWarn('');
      setLoading(true);
      await loadBalance(initData);
      await loadOnline(initData);
    } catch (e: any) {
      console.error(e);
      setWarn(String(e?.message || 'Не удалось обновить'));
    } finally {
      setLoading(false);
    }
  }

  function go(path: string) {
    haptic('light');
    router.push(path);
  }

  return (
    <main className="page">
      <TopBarBack />

      <div className="wrap">
        <div className="title">Мой профиль</div>
        <div className="hello">Здравствуйте {helloLine}</div>

        {/* баланс всегда сверху */}
        <section className="balanceCard" aria-label="Баланс">
          <div className="balanceTop">
            <div className="balanceTitle">Баланс</div>
            <button type="button" className="linkBtn" onClick={onRefresh} disabled={loading}>
              Обновить
            </button>
          </div>

          <div className="balanceGrid">
            <div className="moneyBox">
              <div className="money">{fmtMoneyRub(balanceRub)}</div>
              <div className="moneyLab">доступно</div>
            </div>

            <div className="moneyBox">
              <div className="money">{fmtMoneyRub(pendingRub)}</div>
              <div className="moneyLab">в обработке</div>
            </div>
          </div>

          <div className="total">
            Всего: <b>{fmtMoneyRub(totalRub)}</b>
          </div>

          {warn ? <div className="warn">{warn}</div> : null}
        </section>

        {/* ✅ онлайн/оффлайн сразу после баланса */}
        <section className="onlineCard" aria-label="Статус онлайн">
          <div className="onlineTop">
            <div className="onlineTitle">Статус</div>
            <div className="onlineHint">{onlineLoading ? 'Сохранение…' : 'Показывается в “Врачи онлайн”'}</div>
          </div>

          <div className="onlineSwitch" role="group" aria-label="Онлайн переключатель">
            <button
              type="button"
              className={isOnline ? 'os osActive' : 'os'}
              disabled={onlineLoading || !initData}
              onClick={() => {
                haptic('light');
                if (!initData) return;
                setOnline(initData, true);
              }}
            >
              В сети
            </button>
            <button
              type="button"
              className={!isOnline ? 'os osActiveOff' : 'os'}
              disabled={onlineLoading || !initData}
              onClick={() => {
                haptic('light');
                if (!initData) return;
                setOnline(initData, false);
              }}
            >
              Не в сети
            </button>
          </div>
        </section>

        {/* кнопки как на скрине */}
        <section className="menu" aria-label="Меню кабинета">
          <button type="button" className="menuItem" onClick={() => go('/hamburger/profile/doctor/settings/questions')}>
            <div className="menuText">
              <div className="menuTitle">Вопросы</div>
              <div className="menuSub">Актуальные и архив</div>
            </div>
          </button>

          <button type="button" className="menuItem" onClick={() => go('/hamburger/profile/doctor/settings/consultation')}>
            <div className="menuText">
              <div className="menuTitle">Консультации</div>
              <div className="menuSub">Ваши консультации</div>
            </div>
          </button>

          <button type="button" className="menuItem" onClick={() => go('/hamburger/profile/doctor/settings/operations')}>
            <div className="menuText">
              <div className="menuTitle">История операций</div>
              <div className="menuSub">Платежи и списания</div>
            </div>
          </button>

          <button type="button" className="menuItem" onClick={() => go('/hamburger/profile/doctor/settings/edit')}>
            <div className="menuText">
              <div className="menuTitle">Редактирование профиля</div>
              <div className="menuSub">Данные и настройки</div>
            </div>
          </button>
        </section>
      </div>

      <style jsx>{`
        .page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          background: #f6f7fb;
          overflow-x: hidden;
        }

        .wrap {
          max-width: 430px;
          margin: 0 auto;
          overflow-x: hidden;
        }

        .title {
          margin-top: 6px;
          font-size: 30px;
          font-weight: 950;
          color: #111827;
        }
        .hello {
          margin-top: 6px;
          font-size: 15px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.65);
        }

        .balanceCard {
          margin-top: 14px;
          background: #fff;
          border-radius: 18px;
          padding: 14px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
          overflow: hidden;
        }

        .balanceTop {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
        }
        .balanceTitle {
          font-size: 16px;
          font-weight: 950;
          color: #111827;
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

        .balanceGrid {
          margin-top: 10px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .moneyBox {
          display: grid;
          gap: 2px;
          align-items: center;
          justify-items: start;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(249, 250, 251, 0.9);
          min-width: 0;
          overflow: hidden;
        }
        .money {
          font-size: 16px;
          font-weight: 950;
          color: #111827;
          letter-spacing: -0.02em;
          line-height: 1.2;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .moneyLab {
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.55);
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .total {
          margin-top: 10px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.65);
        }

        .warn {
          margin-top: 8px;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
          font-weight: 800;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .onlineCard {
          margin-top: 12px;
          background: #fff;
          border-radius: 18px;
          padding: 14px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
          overflow: hidden;
        }
        .onlineTop {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          min-width: 0;
        }
        .onlineTitle {
          font-size: 16px;
          font-weight: 950;
          color: #111827;
        }
        .onlineHint {
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.55);
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .onlineSwitch {
          margin-top: 10px;
          background: rgba(15, 23, 42, 0.04);
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 14px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
        }
        .os {
          padding: 12px 10px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.6);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .os:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .osActive {
          background: #24c768;
          color: #fff;
        }
        .osActiveOff {
          background: rgba(15, 23, 42, 0.1);
          color: rgba(17, 24, 39, 0.85);
        }

        .menu {
          margin-top: 14px;
          background: #fff;
          border-radius: 22px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
          padding: 12px;
          display: grid;
          gap: 10px;
          overflow: hidden;
        }

        .menuItem {
          width: 100%;
          text-align: left;
          border: 2px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          border-radius: 18px;
          padding: 14px 14px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          overflow: hidden;
        }
        .menuItem:active {
          transform: scale(0.99);
          opacity: 0.96;
        }

        .menuText {
          display: grid;
          gap: 2px;
          min-width: 0;
        }
        .menuTitle {
          font-size: 16px;
          font-weight: 950;
          color: #111827;
        }
        .menuSub {
          font-size: 13px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.55);
        }

        @media (max-width: 360px) {
          .balanceGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
