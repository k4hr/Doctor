/* path: app/hamburger/profile/consultations/page.tsx */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../components/TopBarBack';

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

function timeAgoRu(input: string | Date) {
  const d = input instanceof Date ? input : new Date(input);
  const ts = d.getTime();
  if (!Number.isFinite(ts)) return '—';

  const diffMs = Date.now() - ts;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 60) return 'только что';

  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} мин назад`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч назад`;

  const days = Math.floor(hr / 24);
  if (days === 1) return '1 день назад';
  if (days >= 2 && days <= 4) return `${days} дня назад`;
  return `${days} дней назад`;
}

function safeSnippet(s: any) {
  const t = String(s ?? '').trim();
  if (!t) return '';
  const oneLine = t.replace(/\s+/g, ' ').trim();
  return oneLine.length > 120 ? oneLine.slice(0, 120).trim() + '…' : oneLine;
}

type ListItem = {
  id: string;
  status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CLOSED';
  createdAt: string;
  priceRub: number;

  doctorId: string;
  doctorName: string;

  lastText?: string | null;
  problemSnippet?: string | null;
};

type ApiOkList = { ok: true; items: ListItem[] };
type ApiErr = { ok: false; error: string; hint?: string };

type UiStatus = 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CLOSED';

function normalizeStatus(s: any): UiStatus {
  const v = String(s || '').toUpperCase().trim();
  if (v === 'DRAFT' || v === 'PENDING' || v === 'ACCEPTED' || v === 'DECLINED' || v === 'CLOSED') return v as UiStatus;
  return 'PENDING';
}

function statusLabel(st: UiStatus) {
  if (st === 'ACCEPTED') return { text: 'Принята', tone: 'green' as const };
  if (st === 'DECLINED') return { text: 'Отказана', tone: 'red' as const };
  if (st === 'CLOSED') return { text: 'Закрыта', tone: 'gray' as const };
  if (st === 'DRAFT') return { text: 'Черновик', tone: 'gray' as const };
  return { text: 'Ожидает решения', tone: 'blue' as const };
}

function priceLabel(priceRub: number) {
  const p = Math.round(Number(priceRub) || 0);
  if (p > 0) return { text: `${p} ₽`, tone: 'gold' as const };
  return { text: 'Бесплатно', tone: 'free' as const };
}

function PatientConsultationCard({ it, onOpen }: { it: ListItem; onOpen: () => void }) {
  const st = statusLabel(normalizeStatus(it.status));
  const pr = priceLabel(it.priceRub);

  const snippet = safeSnippet(it.lastText) || safeSnippet(it.problemSnippet) || st.text;
  const time = timeAgoRu(it.createdAt);

  return (
    <>
      <button type="button" className="cc" onClick={onOpen} aria-label="Открыть консультацию">
        <div className="ccTop">
          <div className="ccText">
            <div className="ccTitle">{String(it.doctorName || '').trim() || 'Врач'}</div>
            <div className="ccSnippet">{snippet}</div>
          </div>

          <div className="ccRight">
            <span className={`ccPill ${pr.tone === 'gold' ? 'ccPill--gold' : 'ccPill--free'}`}>{pr.text}</span>

            <span
              className={`ccPill ${
                st.tone === 'green'
                  ? 'ccPill--green'
                  : st.tone === 'blue'
                  ? 'ccPill--blue'
                  : st.tone === 'red'
                  ? 'ccPill--red'
                  : 'ccPill--gray'
              }`}
            >
              {st.text}
            </span>
          </div>
        </div>

        <div className="ccBottom">
          <span className="ccTime">{time}</span>
        </div>
      </button>

      <style jsx>{`
        .cc {
          width: 100%;
          text-align: left;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;

          border: 1px solid rgba(10, 12, 20, 0.08);
          background: rgba(255, 255, 255, 0.96);
          border-radius: 18px;

          padding: 10px 12px 9px;

          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.07);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);

          display: flex;
          flex-direction: column;
          height: 92px;
          overflow: hidden;
          justify-content: space-between;
        }

        .ccTop {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: start;
          gap: 10px;
          min-width: 0;
        }

        .ccText {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .ccTitle {
          font-size: 12px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.8);
          line-height: 1.05;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ccSnippet {
          font-size: 14px;
          font-weight: 700;
          color: #022c22;

          line-height: 16px;
          height: 32px;
          max-height: 32px;

          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-width: 0;
        }

        .ccRight {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .ccPill {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 9px;
          border-radius: 999px;
          border: 1px solid transparent;
          white-space: nowrap;
          line-height: 1.05;
        }

        .ccPill--free {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.1);
          color: rgba(15, 23, 42, 0.7);
        }

        .ccPill--gold {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.3);
          color: #92400e;
        }

        .ccPill--green {
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.3);
          color: rgba(22, 163, 74, 1);
        }

        .ccPill--blue {
          background: rgba(59, 130, 246, 0.12);
          border-color: rgba(59, 130, 246, 0.3);
          color: rgba(37, 99, 235, 1);
        }

        .ccPill--red {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.28);
          color: rgba(185, 28, 28, 1);
        }

        .ccPill--gray {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.12);
          color: rgba(15, 23, 42, 0.7);
        }

        .ccBottom {
          display: flex;
          justify-content: flex-end;
          align-items: end;
          min-width: 0;
          margin-top: 2px;
        }

        .ccTime {
          white-space: nowrap;
          font-size: 11px;
          font-weight: 600;
          color: rgba(15, 23, 42, 0.62);
          line-height: 1.05;
        }
      `}</style>
    </>
  );
}

export default function HamburgerConsultationsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');
  const [items, setItems] = useState<ListItem[]>([]);

  useEffect(() => {
    try {
      tg()?.ready?.();
      tg()?.expand?.();
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setWarn('');

        const idata = tg()?.initData || '';
        const res = await fetch('/api/profile/consultations', {
          method: 'GET',
          headers: { 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
          cache: 'no-store',
        });

        const j = (await res.json().catch(() => null)) as (ApiOkList | ApiErr) | null;
        if (!res.ok || !j || (j as any).ok !== true) {
          setWarn(String((j as any)?.hint || (j as any)?.error || 'Не удалось загрузить список'));
          setItems([]);
          return;
        }

        setItems(Array.isArray((j as ApiOkList).items) ? (j as ApiOkList).items : []);
      } catch (e: any) {
        console.error(e);
        setWarn(String(e?.message || 'Сеть/сервер недоступны'));
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openChat(id: string) {
    haptic('light');
    router.push(`/hamburger/profile/consultations/${encodeURIComponent(id)}`);
  }

  return (
    <main className="p">
      <TopBarBack />

      <h1 className="t">Консультации</h1>
      <p className="s">Ваши консультации</p>

      {warn ? <div className="warn">{warn}</div> : null}

      {loading ? (
        <div className="muted">Загрузка…</div>
      ) : items.length === 0 ? (
        <div className="muted">Пока консультаций нет.</div>
      ) : (
        <section className="cards" aria-label="Список консультаций">
          {items.map((it) => (
            <PatientConsultationCard key={it.id} it={it} onOpen={() => openChat(it.id)} />
          ))}
        </section>
      )}

      <style jsx>{`
        .p {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          background: #f6f7fb;
          overflow-x: hidden;
        }

        .t {
          margin: 6px 0 0;
          font-size: 34px;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .s {
          margin: 8px 0 14px;
          font-size: 16px;
          font-weight: 600;
          color: rgba(17, 24, 39, 0.58);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .warn {
          margin: 0 0 12px;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
          font-weight: 900;
          overflow-wrap: anywhere;
        }

        .muted {
          font-size: 12px;
          color: rgba(15, 23, 42, 0.6);
          padding: 8px 0;
          font-weight: 800;
        }

        .cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }
      `}</style>
    </main>
  );
}
