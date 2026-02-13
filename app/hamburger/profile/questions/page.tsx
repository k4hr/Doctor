/* path: app/hamburger/profile/questions/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../components/TopBarBack';

type MyQuestionItem = {
  id: string;
  title: string;
  speciality: string;
  createdAt: string; // ISO
  isClosed: boolean;
};

type ApiOk = { ok: true; items: MyQuestionItem[] };
type ApiErr = { ok: false; error: string; hint?: string };
type ApiResp = ApiOk | ApiErr;

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

function fmtDateRu(dIso: string) {
  try {
    const d = new Date(dIso);
    if (!Number.isFinite(d.getTime())) return '—';
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

function clip(s: any, n: number) {
  const t = String(s ?? '').trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1).trimEnd() + '…';
}

export default function HamburgerQuestionsPage() {
  const router = useRouter();

  const [tab, setTab] = useState<'ACTIVE' | 'ARCHIVE'>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');
  const [items, setItems] = useState<MyQuestionItem[]>([]);

  useEffect(() => {
    try {
      tg()?.ready?.();
      tg()?.expand?.();
    } catch {}

    (async () => {
      try {
        setLoading(true);
        setWarn('');

        const res = await fetch('/api/question/my', { method: 'GET', cache: 'no-store' });
        const j = (await res.json().catch(() => null)) as ApiResp | null;

        if (!res.ok || !j || (j as any).ok !== true) {
          setWarn(String((j as any)?.hint || (j as any)?.error || 'Не удалось загрузить вопросы'));
          setItems([]);
          return;
        }

        setItems(Array.isArray((j as ApiOk).items) ? (j as ApiOk).items : []);
      } catch (e) {
        console.error(e);
        setWarn('Ошибка загрузки списка вопросов');
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const wantClosed = tab === 'ARCHIVE';
    return items.filter((q) => (wantClosed ? !!q.isClosed : !q.isClosed));
  }, [items, tab]);

  const goQuestion = (id: string) => {
    haptic('light');
    router.push(`/vopros/${encodeURIComponent(id)}`);
  };

  return (
    <main className="p">
      <TopBarBack />

      <h1 className="t">Вопросы</h1>
      <p className="s">Актуальные и архив</p>

      <div className="seg" role="tablist" aria-label="Переключатель списка вопросов">
        <button
          type="button"
          className={'segBtn ' + (tab === 'ACTIVE' ? 'segBtn--on' : '')}
          onClick={() => {
            haptic('light');
            setTab('ACTIVE');
          }}
          role="tab"
          aria-selected={tab === 'ACTIVE'}
        >
          Активные
        </button>

        <button
          type="button"
          className={'segBtn ' + (tab === 'ARCHIVE' ? 'segBtn--on' : '')}
          onClick={() => {
            haptic('light');
            setTab('ARCHIVE');
          }}
          role="tab"
          aria-selected={tab === 'ARCHIVE'}
        >
          Архив
        </button>
      </div>

      {warn ? <div className="warn">{warn}</div> : null}

      {loading ? (
        <div className="card">
          <div className="muted">Загрузка…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="muted">{tab === 'ACTIVE' ? 'Активных вопросов пока нет.' : 'В архиве пока пусто.'}</div>
        </div>
      ) : (
        <div className="list" aria-label="Список вопросов">
          {filtered.map((q) => (
            <button key={q.id} type="button" className="q" onClick={() => goQuestion(q.id)}>
              <div className="qTop">
                <span className={'badge ' + (q.isClosed ? 'badge--closed' : 'badge--open')}>
                  {q.isClosed ? 'Закрыт' : 'Открыт'}
                </span>
                <span className="date">{fmtDateRu(q.createdAt)}</span>
              </div>

              <div className="title" title={String(q.title || '')}>
                {clip(q.title, 86)}
              </div>

              <div className="meta">
                <span className="spec" title={String(q.speciality || '')}>
                  {q.speciality || '—'}
                </span>
                <span className="arrow">›</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .p {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }
        .t {
          margin: 6px 0 0;
          font-size: 22px;
          font-weight: 950;
          color: #111827;
        }
        .s {
          margin: 6px 0 12px;
          font-size: 13px;
          color: rgba(17, 24, 39, 0.7);
        }

        .seg {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 8px 0 12px;
        }
        .segBtn {
          border-radius: 14px;
          padding: 10px 12px;
          border: 1px solid rgba(15, 23, 42, 0.14);
          background: rgba(249, 250, 251, 1);
          color: rgba(17, 24, 39, 0.82);
          font-weight: 950;
          font-size: 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .segBtn--on {
          border-color: rgba(36, 199, 104, 0.42);
          background: rgba(36, 199, 104, 0.1);
          color: #166534;
          box-shadow: 0 10px 22px rgba(36, 199, 104, 0.14);
        }
        .segBtn:active {
          transform: scale(0.99);
        }

        .warn {
          margin: 0 0 12px;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
          font-weight: 900;
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
          gap: 10px;
        }
        .q {
          width: 100%;
          text-align: left;
          border-radius: 18px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.92);
          padding: 12px;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          display: grid;
          gap: 8px;
        }
        .q:active {
          transform: scale(0.99);
          opacity: 0.96;
        }

        .qTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .badge {
          font-size: 11px;
          font-weight: 950;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          white-space: nowrap;
        }
        .badge--open {
          background: rgba(59, 130, 246, 0.1);
          color: #1e40af;
        }
        .badge--closed {
          background: rgba(109, 40, 217, 0.1);
          color: #6d28d9;
        }
        .date {
          font-size: 11px;
          font-weight: 900;
          color: rgba(15, 23, 42, 0.55);
          white-space: nowrap;
        }

        .title {
          font-size: 14px;
          font-weight: 950;
          color: #111827;
          line-height: 1.25;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .meta {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
        }
        .spec {
          font-size: 12px;
          font-weight: 850;
          color: rgba(15, 23, 42, 0.72);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .arrow {
          font-size: 18px;
          font-weight: 950;
          color: rgba(15, 23, 42, 0.35);
          line-height: 1;
        }
      `}</style>
    </main>
  );
}
