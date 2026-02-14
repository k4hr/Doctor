/* path: app/hamburger/profile/doctor/settings/consultation/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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

type Item = {
  id: string;
  status: string;
  createdAt: string;
  priceRub: number;
  patientTelegramId: string;
  problemSnippet: string;
  coverUrl: string | null;
};

type ApiOk = { ok: true; items: Item[] };
type ApiErr = { ok: false; error: string; hint?: string };
type ApiResp = ApiOk | ApiErr;

type SettingsOk = {
  ok: true;
  proActive: boolean;
  consultationEnabled: boolean;
  consultationPriceRub: number;
  thanksEnabled: boolean;
  proUntil: string | null;
};
type SettingsErr = { ok: false; error: string; hint?: string };
type SettingsResp = SettingsOk | SettingsErr;

type SaveOk = { ok: true; consultationEnabled: boolean; consultationPriceRub: number };
type SaveErr = { ok: false; error: string; hint?: string };
type SaveResp = SaveOk | SaveErr;

function timeAgoRu(input: string) {
  const d = new Date(input);
  const ts = d.getTime();
  if (!Number.isFinite(ts)) return '—';

  const diff = Date.now() - ts;
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) return 'только что';

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} мин назад`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч назад`;

  const days = Math.floor(hr / 24);
  if (days === 1) return '1 день назад';
  if (days >= 2 && days <= 4) return `${days} дня назад`;
  return `${days} дней назад`;
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

function clampPriceInput(v: string) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 1000;
  return Math.max(1000, n);
}

export default function DoctorConsultationsPage() {
  const router = useRouter();

  const [tab, setTab] = useState<'PENDING' | 'ACCEPTED' | 'DECLINED'>('PENDING');
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');
  const [items, setItems] = useState<Item[]>([]);

  // settings
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsWarn, setSettingsWarn] = useState('');
  const [proActive, setProActive] = useState(false);
  const [proUntil, setProUntil] = useState<string | null>(null);

  const [consultationEnabled, setConsultationEnabled] = useState(false);
  const [priceStr, setPriceStr] = useState('1000');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      tg()?.ready?.();
      tg()?.expand?.();
    } catch {}

    const idata = tg()?.initData || '';

    // 1) settings
    (async () => {
      try {
        setSettingsLoading(true);
        setSettingsWarn('');

        const res = await fetch('/api/doctor/consultations/settings', {
          method: 'GET',
          headers: { 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
          cache: 'no-store',
        });

        const j = (await res.json().catch(() => null)) as SettingsResp | null;
        if (!res.ok || !j || (j as any).ok !== true) {
          setSettingsWarn(String((j as any)?.hint || (j as any)?.error || 'Не удалось загрузить настройки'));
          setProActive(false);
          setProUntil(null);
          return;
        }

        const ok = j as SettingsOk;
        setProActive(Boolean(ok.proActive));
        setProUntil(ok.proUntil ?? null);
        setConsultationEnabled(Boolean(ok.consultationEnabled));
        setPriceStr(String(Math.max(1000, Math.round(Number(ok.consultationPriceRub || 1000)))));
      } catch (e: any) {
        console.error(e);
        setSettingsWarn('Ошибка загрузки настроек');
        setProActive(false);
        setProUntil(null);
      } finally {
        setSettingsLoading(false);
      }
    })();

    // 2) list
    (async () => {
      try {
        setLoading(true);
        setWarn('');

        const res = await fetch('/api/doctor/consultations', {
          method: 'GET',
          headers: { 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
          cache: 'no-store',
        });

        const j = (await res.json().catch(() => null)) as ApiResp | null;
        if (!res.ok || !j || (j as any).ok !== true) {
          setWarn(String((j as any)?.hint || (j as any)?.error || 'Не удалось загрузить консультации'));
          setItems([]);
          return;
        }

        setItems(Array.isArray((j as ApiOk).items) ? (j as ApiOk).items : []);
      } catch (e) {
        console.error(e);
        setWarn('Ошибка загрузки списка консультаций');
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => items.filter((x) => String(x.status) === tab), [items, tab]);

  const open = (id: string) => {
    haptic('light');
    router.push(`/hamburger/profile/doctor/settings/consultation/${encodeURIComponent(id)}`);
  };

  async function saveSettings() {
    haptic('medium');
    setSettingsWarn('');

    if (!proActive) {
      tgAlert('Консультации можно настраивать только при активном PRO.');
      return;
    }

    const idata = tg()?.initData || '';
    if (!idata) {
      setSettingsWarn('NO_INIT_DATA');
      tgAlert('Открой мини-приложение через Telegram (initData обязателен).');
      return;
    }

    const priceRub = clampPriceInput(priceStr);

    setSaving(true);
    try {
      const r = await fetch('/api/doctor/consultations/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': idata,
          'X-Init-Data': idata,
        },
        cache: 'no-store',
        body: JSON.stringify({
          consultationEnabled,
          consultationPriceRub: priceRub,
        }),
      });

      const j = (await r.json().catch(() => null)) as SaveResp | null;
      if (!r.ok || !j || (j as any).ok !== true) {
        const msg = (j as any)?.hint || (j as any)?.error || 'Не удалось сохранить настройки';
        setSettingsWarn(String(msg));
        return;
      }

      // нормализуем строку цены обратно
      setPriceStr(String((j as SaveOk).consultationPriceRub));
      setConsultationEnabled(Boolean((j as SaveOk).consultationEnabled));

      tgAlert('Настройки сохранены.');
    } catch (e: any) {
      setSettingsWarn(String(e?.message || 'Сеть/сервер недоступны'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p">
      <TopBarBack />

      <h1 className="t">Консультации</h1>
      <p className="s">Заявки от пациентов. Можно принять или отказать.</p>

      {/* ✅ SETTINGS BLOCK */}
      <section className="setCard" aria-label="Настройки консультаций">
        <div className="setTop">
          <div className="setTitle">Настройки</div>
          {settingsLoading ? (
            <div className="badge badge--muted">загрузка…</div>
          ) : proActive ? (
            <div className="badge badge--pro">PRO активен</div>
          ) : (
            <div className="badge badge--off">PRO нет</div>
          )}
        </div>

        <div className="setRow">
          <div className="setLabel">Консультации</div>
          <button
            type="button"
            className={'toggle ' + (consultationEnabled ? 'toggle--on' : '')}
            onClick={() => (haptic('light'), setConsultationEnabled((v) => !v))}
            disabled={!proActive || settingsLoading || saving}
            aria-label="Включить/выключить консультации"
          >
            <span className="knob" />
          </button>
        </div>

        <div className="setRow">
          <div className="setLabel">Цена (₽)</div>
          <input
            className="price"
            inputMode="numeric"
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value.replace(/[^\d]/g, '').slice(0, 6) || '0')}
            onBlur={() => setPriceStr(String(clampPriceInput(priceStr)))}
            disabled={!proActive || settingsLoading || saving}
            aria-label="Цена консультации"
          />
        </div>

        <div className="setHint">
          Минимум <b>1000 ₽</b>. Благодарности: <b>{proActive ? 'ON' : 'OFF'}</b>
          {proUntil ? (
            <>
              {' '}
              · PRO до <b>{fmtDateRu(proUntil)}</b>
            </>
          ) : null}
        </div>

        {settingsWarn ? <div className="warn">{settingsWarn}</div> : null}

        <button
          type="button"
          className="saveBtn"
          onClick={saveSettings}
          disabled={!proActive || settingsLoading || saving}
        >
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </section>

      <div className="seg" role="tablist" aria-label="Фильтр">
        <button
          type="button"
          className={'segBtn ' + (tab === 'PENDING' ? 'segBtn--on' : '')}
          onClick={() => (haptic('light'), setTab('PENDING'))}
        >
          Ожидают
        </button>
        <button
          type="button"
          className={'segBtn ' + (tab === 'ACCEPTED' ? 'segBtn--on' : '')}
          onClick={() => (haptic('light'), setTab('ACCEPTED'))}
        >
          Приняты
        </button>
        <button
          type="button"
          className={'segBtn ' + (tab === 'DECLINED' ? 'segBtn--on' : '')}
          onClick={() => (haptic('light'), setTab('DECLINED'))}
        >
          Отказаны
        </button>
      </div>

      {warn ? <div className="warn">{warn}</div> : null}

      {loading ? (
        <div className="card">
          <div className="muted">Загрузка…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="muted">Пока пусто.</div>
        </div>
      ) : (
        <div className="list" aria-label="Список консультаций">
          {filtered.map((c) => (
            <button key={c.id} type="button" className="it" onClick={() => open(c.id)}>
              <div className="left">
                <div className="topRow">
                  <span className={'st ' + (tab === 'PENDING' ? 'st--wait' : tab === 'ACCEPTED' ? 'st--ok' : 'st--no')}>
                    {tab === 'PENDING' ? 'Ожидает решения' : tab === 'ACCEPTED' ? 'Принята' : 'Отказана'}
                  </span>
                  <span className="time">{timeAgoRu(c.createdAt)}</span>
                </div>
                <div className="txt">{c.problemSnippet || '—'}</div>
                <div className="meta">
                  Цена: <b>{Math.round(Number(c.priceRub || 0))} ₽</b>
                </div>
              </div>

              {c.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="ph" src={c.coverUrl} alt="" />
              ) : (
                <div className="ph ph--empty">фото</div>
              )}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .p {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          background: #f6f7fb;
        }

        .t {
          margin: 6px 0 0;
          font-size: 30px;
          font-weight: 950;
          color: #111827;
          letter-spacing: -0.02em;
        }
        .s {
          margin: 8px 0 12px;
          font-size: 14px;
          font-weight: 700;
          color: rgba(17, 24, 39, 0.58);
        }

        /* settings */
        .setCard {
          background: #fff;
          border-radius: 18px;
          padding: 12px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
          display: grid;
          gap: 10px;
          margin: 0 0 14px;
        }

        .setTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-width: 0;
        }

        .setTitle {
          font-size: 14px;
          font-weight: 950;
          color: #111827;
        }

        .badge {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 950;
          border: 1px solid rgba(15, 23, 42, 0.12);
          white-space: nowrap;
        }
        .badge--pro {
          background: rgba(109, 40, 217, 0.1);
          border-color: rgba(109, 40, 217, 0.25);
          color: #6d28d9;
        }
        .badge--off {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        .badge--muted {
          background: rgba(17, 24, 39, 0.06);
          border-color: rgba(17, 24, 39, 0.08);
          color: rgba(17, 24, 39, 0.6);
        }

        .setRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .setLabel {
          font-size: 13px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.78);
        }

        .toggle {
          width: 54px;
          height: 30px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(17, 24, 39, 0.08);
          position: relative;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          flex: 0 0 auto;
        }
        .toggle:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .toggle .knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
          transition: transform 160ms ease;
        }
        .toggle--on {
          background: rgba(36, 199, 104, 0.25);
          border-color: rgba(36, 199, 104, 0.35);
        }
        .toggle--on .knob {
          transform: translateX(24px);
        }

        .price {
          width: 120px;
          height: 40px;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(249, 250, 251, 0.9);
          padding: 0 12px;
          font-size: 14px;
          font-weight: 900;
          color: #111827;
          outline: none;
          text-align: right;
        }

        .setHint {
          font-size: 12px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.58);
          line-height: 1.35;
        }

        .saveBtn {
          width: 100%;
          border: none;
          border-radius: 16px;
          padding: 12px 12px;
          font-size: 14px;
          font-weight: 950;
          color: #fff;
          cursor: pointer;
          background: #24c768;
          box-shadow: 0 10px 20px rgba(36, 199, 104, 0.28);
          -webkit-tap-highlight-color: transparent;
        }
        .saveBtn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }

        .seg {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin: 6px 0 14px;
        }

        .segBtn {
          border-radius: 16px;
          padding: 10px 10px;
          border: 1px solid rgba(15, 23, 42, 0.14);
          background: rgba(255, 255, 255, 0.92);
          color: rgba(17, 24, 39, 0.72);
          font-weight: 900;
          font-size: 14px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.05);
        }
        .segBtn--on {
          border-color: rgba(36, 199, 104, 0.45);
          background: rgba(36, 199, 104, 0.12);
          color: rgba(22, 163, 74, 1);
          box-shadow: 0 10px 22px rgba(36, 199, 104, 0.14);
        }

        .warn {
          margin: 0 0 12px;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
          font-weight: 900;
          overflow-wrap: anywhere;
        }

        .card {
          border-radius: 18px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.92);
          padding: 14px;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
        }
        .muted {
          font-weight: 800;
          color: rgba(15, 23, 42, 0.65);
          font-size: 13px;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .it {
          width: 100%;
          text-align: left;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;

          border: 1px solid rgba(10, 12, 20, 0.08);
          background: rgba(255, 255, 255, 0.96);
          border-radius: 18px;

          padding: 12px;

          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.07);

          display: grid;
          grid-template-columns: 1fr 70px;
          gap: 12px;
          align-items: center;
        }

        .it:active {
          transform: translateY(1px);
          box-shadow: 0 6px 18px rgba(18, 28, 45, 0.11);
        }

        .left {
          min-width: 0;
          display: grid;
          gap: 6px;
        }

        .topRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .st {
          font-size: 11px;
          font-weight: 900;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          white-space: nowrap;
          line-height: 1;
        }
        .st--wait {
          background: rgba(59, 130, 246, 0.12);
          border-color: rgba(59, 130, 246, 0.28);
          color: #2563eb;
        }
        .st--ok {
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.26);
          color: rgba(22, 163, 74, 1);
        }
        .st--no {
          background: rgba(239, 68, 68, 0.10);
          border-color: rgba(239, 68, 68, 0.22);
          color: #ef4444;
        }

        .time {
          font-size: 12px;
          font-weight: 900;
          color: rgba(15, 23, 42, 0.5);
          white-space: nowrap;
        }

        .txt {
          font-size: 13px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.82);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .meta {
          font-size: 12px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.55);
        }

        .ph {
          width: 70px;
          height: 70px;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          object-fit: cover;
          background: rgba(249, 250, 251, 1);
        }

        .ph--empty {
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 900;
          color: rgba(15, 23, 42, 0.45);
        }
      `}</style>
    </main>
  );
}
