/* path: app/page.tsx */
'use client';

import { useEffect } from 'react';
import TopBar from '../components/TopBar';
import MainSearch from '../components/MainSearch';
import DownBar from '../components/DownBar';

type Question = {
  id: number;
  title: string;
  snippet: string;
  status: 'answering' | 'waiting' | 'done';
  speciality: string;
  timeAgo: string;
};

const QUESTIONS: Question[] = [
  {
    id: 1,
    title: 'Температура у ребёнка 38.7',
    snippet:
      'Вчера прививка, сегодня высокая температура и вялость. Давала Нурофен…',
    status: 'answering',
    speciality: 'Педиатр',
    timeAgo: '2 мин назад',
  },
  {
    id: 2,
    title: 'Боль в груди при вдохе',
    snippet:
      'Тянущая боль слева при глубоком вдохе, не могу понять, сердце это или мышца…',
    status: 'waiting',
    speciality: 'Терапевт',
    timeAgo: '5 мин назад',
  },
  {
    id: 3,
    title: 'Сыпь после антибиотиков',
    snippet:
      'Пил антибиотики 5 дней, появилась сыпь на руках и шее. Это аллергия?',
    status: 'done',
    speciality: 'Аллерголог',
    timeAgo: '18 мин назад',
  },
  {
    id: 4,
    title: 'Паническая атака или сердце?',
    snippet:
      'Внезапно начинается сильное сердцебиение, бросает в жар и трясёт…',
    status: 'answering',
    speciality: 'Психотерапевт',
    timeAgo: '10 мин назад',
  },
];

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

export default function FeedPage() {
  useEffect(() => {
    const w: any = window;
    try {
      w?.Telegram?.WebApp?.ready?.();
      w?.Telegram?.WebApp?.expand?.();
    } catch {}
  }, []);

  const handleQuestionClick = (q: Question) => {
    haptic('light');
    console.log('open question', q.id);
  };

  const handleAskClick = () => {
    haptic('medium');
    console.log('open ask form');
  };

  const handleSearchClick = () => {
    haptic('light');
    console.log('search click');
  };

  const handleFiltersClick = () => {
    haptic('light');
    console.log('filters click');
  };

  const handleSortClick = () => {
    haptic('light');
    console.log('sort click');
  };

  return (
    <main className="feed">
      {/* ВСЁ содержимое страницы */}
      <div className="feed-content">
        {/* Топбар */}
        <TopBar />

        {/* Зелёная кнопка "Задать вопрос" */}
        <div className="feed-ask-wrap">
          <button
            type="button"
            className="feed-ask-btn"
            onClick={handleAskClick}
          >
            Задать вопрос
          </button>
        </div>

        {/* Поиск */}
        <MainSearch onClick={handleSearchClick} />

        {/* Фильтры / сортировка */}
        <div className="feed-filters-row">
          <button
            type="button"
            className="pill-btn pill-btn--ghost"
            onClick={handleFiltersClick}
          >
            Фильтры
          </button>
          <button
            type="button"
            className="pill-btn pill-btn--outline"
            onClick={handleSortClick}
          >
            Платные / Бесплатные
          </button>
        </div>

        {/* Лента вопросов */}
        <section className="feed-list" aria-label="Онлайн-вопросы пациентов">
          {QUESTIONS.map((q) => (
            <button
              key={q.id}
              type="button"
              className="q-card"
              onClick={() => handleQuestionClick(q)}
            >
              <div className="q-top">
                <h2 className="q-title">{q.title}</h2>
                <span
                  className={
                    'q-status ' +
                    (q.status === 'answering'
                      ? 'q-status--answering'
                      : q.status === 'waiting'
                      ? 'q-status--waiting'
                      : 'q-status--done')
                  }
                >
                  {q.status === 'answering' && 'Врач отвечает'}
                  {q.status === 'waiting' && 'Ожидает врача'}
                  {q.status === 'done' && 'Ответ готов'}
                </span>
              </div>
              <p className="q-snippet">{q.snippet}</p>
              <div className="q-meta">
                <span className="q-chip">{q.speciality}</span>
                <span className="q-time">{q.timeAgo}</span>
              </div>
            </button>
          ))}
        </section>

        <footer className="feed-footer">
          <p>
            Хотите задать свой вопрос?{' '}
            <span className="feed-link">
              Скоро добавим кнопку для пациентов
            </span>
          </p>
        </footer>
      </div>

      {/* DownBar всегда внизу, потому что main — flex и у контента flex:1 */}
      <DownBar />

      <style jsx>{`
        .feed {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px);
          display: flex;
          flex-direction: column;
        }

        .feed-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* Обёртка зелёной кнопки под хедером */
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
          text-align: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 10px 20px rgba(36, 199, 104, 0.35);
        }

        .feed-ask-btn:active {
          transform: scale(0.98);
          box-shadow: 0 6px 14px rgba(36, 199, 104, 0.4);
        }

        /* ====== ФИЛЬТРЫ / СОРТИРОВКА — компактные ====== */
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
          -webkit-tap-highlight-color: transparent;
          cursor: pointer;
        }

        .pill-btn--ghost {
          background: rgba(15, 23, 42, 0.03);
          border-color: rgba(15, 23, 42, 0.08);
        }

        .pill-btn--outline {
          background: #ffffff;
          border-color: rgba(36, 199, 104, 0.45);
          color: #059669;
        }

        .pill-btn:active {
          transform: scale(0.98);
          opacity: 0.9;
        }

        /* ====== ЛЕНТА ВОПРОСОВ ====== */
        .feed-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }

        .q-card {
          text-align: left;
          padding: 14px 14px 12px;
          border-radius: 16px;
          border: 1px solid rgba(10, 12, 20, 0.08);
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .q-card:active {
          transform: translateY(1px);
          box-shadow: 0 6px 18px rgba(18, 28, 45, 0.12);
        }

        .q-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .q-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #0b0c10;
        }

        .q-status {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .q-status--answering {
          background: rgba(36, 199, 104, 0.08);
          border-color: rgba(36, 199, 104, 0.35);
          color: #15834a;
        }

        .q-status--waiting {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.35);
          color: #92400e;
        }

        .q-status--done {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.18);
          color: rgba(15, 23, 42, 0.8);
        }

        .q-snippet {
          margin: 4px 0 0;
          font-size: 13px;
          line-height: 1.4;
          color: rgba(11, 12, 16, 0.8);
        }

        .q-meta {
          margin-top: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
        }

        .q-chip {
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.04);
          color: rgba(15, 23, 42, 0.9);
        }

        .q-time {
          color: rgba(15, 23, 42, 0.55);
        }

        .feed-footer {
          margin-top: 6px;
          font-size: 11px;
          color: rgba(15, 23, 42, 0.55);
          text-align: center;
        }

        .feed-link {
          color: #24c768;
          font-weight: 600;
        }
      `}</style>
    </main>
  );
}
