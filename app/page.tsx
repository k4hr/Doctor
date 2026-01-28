/* path: app/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../components/TopBar';
import MainSearch from '../components/MainSearch';
import DownBar from '../components/DownBar';

import QuestionCard from './vopros/main/QuestionCard';
import { FeedQuestionItem, feedMergeServerItems, useFeedItems } from './lib/questionsStore';

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
    const res = await fetch(input, { ...init, signal: controller.signal, cache: 'no-store' });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export default function FeedPage() {
  const router = useRouter();

  // ✅ мгновенно показываем то, что уже есть (в т.ч. добавленное из /vopros)
  const storeItems = useFeedItems();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState('');

  const hasItems = useMemo(() => storeItems.length > 0, [storeItems]);

  useEffect(() => {
    try {
      (window as any)?.Telegram?.WebApp?.ready?.();
      (window as any)?.Telegram?.WebApp?.expand?.();
    } catch {}
  }, []);

  // ✅ подгружаем серверную ленту и мерджим со стором (optimistic не “теряем”)
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
          setInfo(j?.error ? `Ошибка: ${String(j.error)}` : `Ошибка загрузки (${res.status})`);
          return;
        }

        const items: FeedQuestionItem[] = Array.isArray(j?.items) ? j.items : [];
        feedMergeServerItems(items);
      } catch (e: any) {
        console.error(e);
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

  return (
    <main className="feed">
      <TopBar />

      <section className="feed-main">
        <div className="feed-ask-wrap">
          <button type="button" className="feed-ask-btn" onClick={handleAskClick}>
            Задать вопрос
          </button>
        </div>

        <MainSearch onClick={() => haptic('light')} />

        <div className="feed-filters-row">
          <button type="button" className="pill-btn pill-btn--ghost" onClick={() => haptic('light')}>
            Фильтры
          </button>
          <button type="button" className="pill-btn pill-btn--outline" onClick={() => haptic('light')}>
            Платные / Бесплатные
          </button>
        </div>

        <section className="feed-list" aria-label="Вопросы">
          {loading && !hasItems ? <div className="muted">Загружаем вопросы…</div> : null}
          {!loading && info ? <div className="muted">{info}</div> : null}
          {!loading && !info && !hasItems ? <div className="muted">Пока нет вопросов.</div> : null}

          {hasItems ? (
            <div className="cards">
              {storeItems.map((q) => (
                <QuestionCard key={q.id} q={q as any} hrefBase="/vopros" />
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
