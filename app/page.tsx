/* path: app/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../components/TopBar';
import MainSearch from '../components/MainSearch';
import DownBar from '../components/DownBar';

import QuestionCard, { QuestionCardData } from './vopros/main/QuestionCard';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit & { timeoutMs?: number } = {}) {
  const timeoutMs = init.timeoutMs ?? 25000;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export default function FeedPage() {
  const router = useRouter();

  const [items, setItems] = useState<QuestionCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState('');

  const hasItems = useMemo(() => items && items.length > 0, [items]);

  useEffect(() => {
    const w: any = window;
    try {
      w?.Telegram?.WebApp?.ready?.();
      w?.Telegram?.WebApp?.expand?.();
    } catch {}
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setInfo('');

      try {
        const res = await fetchWithTimeout('/api/question/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeoutMs: 25000,
          body: JSON.stringify({ limit: 30 }),
        });

        const j = await res.json().catch(() => ({} as any));
        if (!res.ok || !j?.ok) {
          setItems([]);
          setInfo(j?.error ? `Ошибка: ${String(j.error)}` : `Ошибка загрузки (${res.status})`);
          setLoading(false);
          return;
        }

        setItems(Array.isArray(j?.items) ? j.items : []);
      } catch (e: any) {
        console.error(e);
        setItems([]);
        setInfo(e?.name === 'AbortError' ? 'Таймаут: сервер отвечает слишком долго.' : 'Сеть/сервер недоступны.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleAskClick = () => {
    haptic('medium');
    router.push('/vopros');
  };

  const handleSearchClick = () => haptic('light');
  const handleFiltersClick = () => haptic('light');
  const handleSortClick = () => haptic('light');

  return (
    <main className="feed">
      <TopBar />

      <section className="feed-main">
        <div className="feed-ask-wrap">
          <button type="button" className="feed-ask-btn" onClick={handleAskClick}>
            Задать вопрос
          </button>
        </div>

        <MainSearch onClick={handleSearchClick} />

        <div className="feed-filters-row">
          <button type="button" className="pill-btn pill-btn--ghost" onClick={handleFiltersClick}>
            Фильтры
          </button>
          <button type="button" className="pill-btn pill-btn--outline" onClick={handleSortClick}>
            Платные / Бесплатные
          </button>
        </div>

        <section className="feed-list" aria-label="Вопросы">
          {loading ? <div className="muted">Загружаем вопросы…</div> : null}
          {!loading && info ? <div className="muted">{info}</div> : null}
          {!loading && !info && !hasItems ? <div className="muted">Пока нет вопросов.</div> : null}

          {!loading && hasItems ? (
            <div className="cards">
              {items.map((q) => (
                <QuestionCard key={q.id} q={q} hrefBase="/vopros" />
              ))}
            </div>
          ) : null}
        </section>

        <DownBar />
      </section>

      <style jsx>{`
        .feed {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }
        .feed-main {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding-bottom: 72px;
        }
        .feed-ask-wrap {
          display: flex;
          justify-content: center;
          margin-top: 4px;
        }
        .feed-ask-btn {
          width: 100%;
          max-width: 260px;
          padding: 14px 16px;
          border-radius: 999px;
          border: none;
          background: #24c768;
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 10px 20px rgba(36, 199, 104, 0.35);
        }
        .feed-ask-btn:active {
          transform: scale(0.98);
          box-shadow: 0 6px 14px rgba(36, 199, 104, 0.4);
        }
        .feed-filters-row {
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
        .pill-btn {
          flex: 1;
          padding: 8px 0;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid transparent;
          background: #ffffff;
          color: #111827;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .pill-btn--ghost {
          background: rgba(15, 23, 42, 0.03);
          border-color: rgba(15, 23, 42, 0.08);
        }
        .pill-btn--outline {
          border-color: rgba(36, 199, 104, 0.45);
          color: #059669;
        }
        .pill-btn:active {
          transform: scale(0.98);
          opacity: 0.9;
        }
        .feed-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }
        .cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .muted {
          font-size: 12px;
          color: rgba(15, 23, 42, 0.6);
          padding: 8px 0;
        }
      `}</style>
    </main>
  );
}
