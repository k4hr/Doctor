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

type BalanceOk = { ok: true; doctorId: string; balanceRub: number; pendingRub: number };
type BalanceErr = { ok: false; error: string; hint?: string };
type BalanceResp = BalanceOk | BalanceErr;

type AnswerItem = {
  id: string;
  questionId: string;
  createdAt: string;
  body: string;
  questionTitle: string | null;
  questionSpeciality: string | null;
};
type AnswersOk = { ok: true; doctorId: string; items: AnswerItem[] };
type AnswersErr = { ok: false; error: string; hint?: string };
type AnswersResp = AnswersOk | AnswersErr;

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

type PayoutOk = { ok: true; payoutId: string };
type PayoutErr = { ok: false; error: string; hint?: string };
type PayoutResp = PayoutOk | PayoutErr;

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

export default function DoctorSettingsPage() {
  const router = useRouter();

  const [initData, setInitData] = useState('');
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');

  const [tab, setTab] = useState<'balance' | 'answers' | 'tx'>('balance');
  const [txTab, setTxTab] = useState<'in' | 'out'>('in');

  const [doctorId, setDoctorId] = useState<string>('');

  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceWarn, setBalanceWarn] = useState('');
  const [balanceRub, setBalanceRub] = useState(0);
  const [pendingRub, setPendingRub] = useState(0);

  const [answersLoading, setAnswersLoading] = useState(false);
  const [answersWarn, setAnswersWarn] = useState('');
  const [answers, setAnswers] = useState<AnswerItem[]>([]);

  const [txLoading, setTxLoading] = useState(false);
  const [txWarn, setTxWarn] = useState('');
  const [txItems, setTxItems] = useState<TxItem[]>([]);

  const titleName = useMemo(() => (doctorId ? `Врач #${doctorId.slice(0, 6)}` : 'Врач'), [doctorId]);

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

        // ✅ проверяем доступ через API баланса (он же вернёт doctorId)
        const r = await fetch('/api/doctor/balance', {
          method: 'GET',
          headers: { 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
          cache: 'no-store',
        });

        const j = (await r.json().catch(() => null)) as BalanceResp | null;

        if (!r.ok || !j || (j as any).ok !== true) {
          setWarn((j as any)?.hint || (j as any)?.error || 'Нет доступа к кабинету');
          router.replace('/hamburger/profile');
          return;
        }

        setDoctorId((j as BalanceOk).doctorId);
        setBalanceRub((j as BalanceOk).balanceRub || 0);
        setPendingRub((j as BalanceOk).pendingRub || 0);
      } catch (e) {
        console.error(e);
        setWarn('Ошибка проверки доступа');
        router.replace('/hamburger/profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function loadBalance() {
    if (!initData) return;
    try {
      setBalanceLoading(true);
      setBalanceWarn('');

      const r = await fetch('/api/doctor/balance', {
        method: 'GET',
        headers: { 'X-Telegram-Init-Data': initData, 'X-Init-Data': initData },
        cache: 'no-store',
      });
      const j = (await r.json().catch(() => null)) as BalanceResp | null;

      if (!r.ok || !j || (j as any).ok !== true) {
        setBalanceWarn((j as any)?.hint || (j as any)?.error || 'Не удалось загрузить баланс');
        return;
      }

      setDoctorId((j as BalanceOk).doctorId);
      setBalanceRub((j as BalanceOk).balanceRub || 0);
      setPendingRub((j as BalanceOk).pendingRub || 0);
    } catch (e) {
      console.error(e);
      setBalanceWarn('Ошибка сети/сервера при загрузке баланса');
    } finally {
      setBalanceLoading(false);
    }
  }

  async function loadAnswers() {
    if (!initData) return;
    try {
      setAnswersLoading(true);
      setAnswersWarn('');

      const r = await fetch('/api/doctor/answers?limit=200', {
        method: 'GET',
        headers: { 'X-Telegram-Init-Data': initData, 'X-Init-Data': initData },
        cache: 'no-store',
      });

      const j = (await r.json().catch(() => null)) as AnswersResp | null;

      if (!r.ok || !j || (j as any).ok !== true) {
        setAnswersWarn((j as any)?.hint || (j as any)?.error || 'Не удалось загрузить ответы');
        setAnswers([]);
        return;
      }

      setDoctorId((j as AnswersOk).doctorId);
      setAnswers((j as AnswersOk).items || []);
    } catch (e) {
      console.error(e);
      setAnswersWarn('Ошибка сети/сервера при загрузке ответов');
      setAnswers([]);
    } finally {
      setAnswersLoading(false);
    }
  }

  async function loadTx() {
    if (!initData) return;
    try {
      setTxLoading(true);
      setTxWarn('');

      const type = txTab === 'in' ? 'IN' : 'OUT';
      const r = await fetch(`/api/doctor/transactions?type=${encodeURIComponent(type)}&limit=500`, {
        method: 'GET',
        headers: { 'X-Telegram-Init-Data': initData, 'X-Init-Data': initData },
        cache: 'no-store',
      });

      const j = (await r.json().catch(() => null)) as TxResp | null;

      if (!r.ok || !j || (j as any).ok !== true) {
        setTxWarn((j as any)?.hint || (j as any)?.error || 'Не удалось загрузить транзакции');
        setTxItems([]);
        return;
      }

      setDoctorId((j as TxOk).doctorId);
      setTxItems((j as TxOk).items || []);
    } catch (e) {
      console.error(e);
      setTxWarn('Ошибка сети/сервера при загрузке транзакций');
      setTxItems([]);
    } finally {
      setTxLoading(false);
    }
  }

  useEffect(() => {
    if (!doctorId) return;
    if (tab === 'balance') loadBalance();
    if (tab === 'answers') loadAnswers();
    if (tab === 'tx') loadTx();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, doctorId]);

  useEffect(() => {
    if (tab !== 'tx') return;
    if (!doctorId) return;
    loadTx();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txTab]);

  async function requestPayout() {
    haptic('light');
    if (!initData) return;

    const amount = Math.max(0, Math.floor(balanceRub));
    if (amount <= 0) {
      setBalanceWarn('Баланс 0 ₽ — вывод недоступен');
      return;
    }

    try {
      setBalanceLoading(true);
      setBalanceWarn('');

      const r = await fetch('/api/doctor/payout/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData,
          'X-Init-Data': initData,
        },
        body: JSON.stringify({ amountRub: amount }),
      });

      const j = (await r.json().catch(() => null)) as PayoutResp | null;

      if (!r.ok || !j || (j as any).ok !== true) {
        setBalanceWarn((j as any)?.hint || (j as any)?.error || 'Не удалось создать заявку');
        return;
      }

      setBalanceWarn('Заявка на вывод создана ✅');
      await loadBalance();
    } catch (e) {
      console.error(e);
      setBalanceWarn('Ошибка сети/сервера при создании заявки');
    } finally {
      setBalanceLoading(false);
    }
  }

  return (
    <main className="page">
      <TopBarBack />

      <section className="hero">
        <div className="title">Кабинет врача</div>
        <div className="sub">{loading ? 'Загрузка…' : titleName}</div>
        {warn ? <div className="warn">{warn}</div> : null}
      </section>

      <section className="tabs">
        <button type="button" className={tab === 'balance' ? 'tab tabActive' : 'tab'} onClick={() => setTab('balance')}>
          Баланс
        </button>
        <button type="button" className={tab === 'answers' ? 'tab tabActive' : 'tab'} onClick={() => setTab('answers')}>
          Ответы
        </button>
        <button type="button" className={tab === 'tx' ? 'tab tabActive' : 'tab'} onClick={() => setTab('tx')}>
          История
        </button>
      </section>

      <section className="content">
        {tab === 'balance' ? (
          <div className="card">
            <div className="cardTitle">Баланс</div>

            <div className="moneyBox">
              <div className="money">{fmtMoneyRub(balanceRub)}</div>
              <div className="moneyLab">доступно</div>
            </div>

            <div className="moneyBox small">
              <div className="money small">{fmtMoneyRub(pendingRub)}</div>
              <div className="moneyLab small">в обработке</div>
            </div>

            {balanceWarn ? <div className="warnSmall">{balanceWarn}</div> : null}

            <div className="btnRow">
              <button type="button" className="btnPrimary" disabled={balanceLoading} onClick={requestPayout}>
                {balanceLoading ? 'Подождите…' : 'Вывод средств'}
              </button>
              <button type="button" className="btnGhost" disabled={balanceLoading} onClick={loadBalance}>
                Обновить
              </button>
            </div>

            <div className="hint">
              Сейчас баланс/история — заглушки, потому что в Prisma-схеме нет моделей кошелька/транзакций. Но привязка идёт к
              твоему doctorId.
            </div>
          </div>
        ) : null}

        {tab === 'answers' ? (
          <div className="card">
            <div className="cardTitle">Ответы врача</div>

            {answersWarn ? <div className="warnSmall">{answersWarn}</div> : null}
            {answersLoading ? <div className="muted">Загрузка…</div> : null}
            {!answersLoading && answers.length === 0 ? <div className="muted">Пока ответов нет.</div> : null}

            <div className="list">
              {answers.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="item"
                  onClick={() => {
                    haptic('light');
                    router.push(`/vopros/${encodeURIComponent(a.questionId)}`);
                  }}
                >
                  <div className="top">
                    <div className="t">{a.questionTitle || 'Вопрос'}</div>
                    <div className="d">{fmtDateTimeRu(a.createdAt)}</div>
                  </div>
                  <div className="m">{a.questionSpeciality || '—'}</div>
                  <div className="b">{a.body || ''}</div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {tab === 'tx' ? (
          <div className="card">
            <div className="cardTitle">История транзакций</div>

            <div className="subtabs">
              <button
                type="button"
                className={txTab === 'in' ? 'subtab subtabActive' : 'subtab'}
                onClick={() => setTxTab('in')}
              >
                Поступления
              </button>
              <button
                type="button"
                className={txTab === 'out' ? 'subtab subtabActive' : 'subtab'}
                onClick={() => setTxTab('out')}
              >
                Выводы
              </button>
            </div>

            {txWarn ? <div className="warnSmall">{txWarn}</div> : null}
            {txLoading ? <div className="muted">Загрузка…</div> : null}
            {!txLoading && txItems.length === 0 ? <div className="muted">Пока транзакций нет.</div> : null}

            <div className="txList">
              {txItems.map((t) => (
                <div key={t.id} className="tx">
                  <div className="txTop">
                    <div className="txTitle">{t.title || (t.type === 'IN' ? 'Поступление' : 'Вывод')}</div>
                    <div className="txAmount">{fmtMoneyRub(t.amountRub)}</div>
                  </div>
                  <div className="txBottom">
                    <div className="txDate">{fmtDateTimeRu(t.createdAt)}</div>
                    <div className="txStatus">{t.status}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="btnRow" style={{ marginTop: 10 }}>
              <button type="button" className="btnGhost" disabled={txLoading} onClick={loadTx}>
                Обновить
              </button>
            </div>
          </div>
        ) : null}
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
          padding: 14px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
        }
        .title {
          font-size: 18px;
          font-weight: 950;
          color: #111827;
        }
        .sub {
          margin-top: 4px;
          font-size: 13px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.6);
        }
        .warn {
          margin-top: 8px;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
          font-weight: 800;
        }

        .tabs {
          margin-top: 10px;
          background: #fff;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.04);
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
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
        }
        .card {
          background: #fff;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.04);
          padding: 12px;
        }
        .cardTitle {
          font-size: 14px;
          font-weight: 950;
          color: #111827;
          margin-bottom: 10px;
        }

        .moneyBox {
          display: grid;
          gap: 2px;
          align-items: center;
          justify-items: center;
          padding: 12px 10px;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(249, 250, 251, 0.9);
        }
        .moneyBox.small {
          margin-top: 8px;
          padding: 10px 10px;
          opacity: 0.9;
        }
        .money {
          font-size: 22px;
          font-weight: 950;
          color: #111827;
          letter-spacing: -0.02em;
        }
        .money.small {
          font-size: 18px;
        }
        .moneyLab {
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.55);
        }
        .moneyLab.small {
          font-size: 11px;
        }

        .btnRow {
          margin-top: 10px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .btnPrimary {
          width: 100%;
          border: none;
          border-radius: 14px;
          padding: 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          background: #24c768;
          color: #fff;
          font-size: 14px;
          font-weight: 950;
          text-align: center;
          box-shadow: 0 10px 20px rgba(36, 199, 104, 0.22);
        }
        .btnPrimary:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .btnGhost {
          width: 100%;
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 14px;
          padding: 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          background: rgba(15, 23, 42, 0.02);
          color: rgba(17, 24, 39, 0.75);
          font-size: 14px;
          font-weight: 950;
          text-align: center;
        }

        .hint {
          margin-top: 10px;
          font-size: 12px;
          line-height: 1.35;
          color: rgba(17, 24, 39, 0.55);
          font-weight: 800;
        }
        .warnSmall {
          margin-top: 8px;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
          font-weight: 800;
        }
        .muted {
          margin: 0;
          font-size: 13px;
          color: rgba(17, 24, 39, 0.55);
          font-weight: 800;
        }

        .list {
          margin-top: 10px;
          display: grid;
          gap: 10px;
        }
        .item {
          text-align: left;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(249, 250, 251, 0.9);
          border-radius: 14px;
          padding: 10px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .item:active {
          transform: scale(0.99);
          opacity: 0.95;
        }
        .top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: baseline;
        }
        .t {
          font-size: 13px;
          font-weight: 950;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }
        .d {
          font-size: 11px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.45);
          white-space: nowrap;
        }
        .m {
          margin-top: 4px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.6);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .b {
          margin-top: 6px;
          font-size: 13px;
          line-height: 1.45;
          color: rgba(17, 24, 39, 0.78);
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
          max-height: 4.4em;
          overflow: hidden;
        }

        .subtabs {
          margin: 4px 0 10px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .subtab {
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: rgba(15, 23, 42, 0.03);
          color: rgba(17, 24, 39, 0.7);
          border-radius: 12px;
          padding: 10px;
          font-weight: 950;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .subtabActive {
          background: rgba(109, 40, 217, 0.12);
          border-color: rgba(109, 40, 217, 0.25);
          color: #6d28d9;
        }

        .txList {
          margin-top: 10px;
          display: grid;
          gap: 10px;
        }
        .tx {
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(249, 250, 251, 0.9);
          border-radius: 14px;
          padding: 10px;
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
          color: rgba(17, 24, 39, 0.8);
          white-space: nowrap;
        }
        .txBottom {
          margin-top: 6px;
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
        }
      `}</style>
    </main>
  );
}
