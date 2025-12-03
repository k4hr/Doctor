/* path: app/page.tsx */
'use client';

import { useEffect } from 'react';
import TopBar from '../components/TopBar';

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
    // TODO: открыть конкретный вопрос, когда появится /question/[id]
    console.log('open question', q.id);
  };

  const handleAskClick = () => {
    haptic('medium');
    // TODO: открыть форму создания вопроса
    console.log('open ask form');
  };

  const handleSearchClick = () => {
    haptic('light');
    // TODO: фокус на инпут или открыть отдельный экран поиска
    console.log('search click');
  };

  const handleFiltersClick = () => {
    haptic('light');
    // TODO: открыть модал с фильтрами (списки врачей и т.п.)
    console.log('filters click');
  };

  const handleSortClick = () => {
    haptic('light');
    // TODO: переключатель платные/бесплатные
    console.log('sort click');
  };

  return (
    <main className="feed">
      {/* При скролле эта панель остаётся прилепленной сверху */}
      <TopBar />

      {/* Зелёная кнопка "Задать вопрос" сразу под топбаром */}
      <div className="feed-ask-wrap">
        <button type="button" className="feed-ask-btn" onClick={handleAskClick}>
          Задать вопрос
        </button>
      </div>

      {/* Строка поиска по вопросам */}
      <div className="feed-search-wrap">
        <button
          type="button"
          className="feed-search-box"
          onClick={handleSearchClick}
        >
          <span className="feed-search-icon">🔍</span>
          <span className="feed-search-placeholder">Поиск по вопросам</span>
          {/* Иконка «ползунки» справа — как на скрине, просто заглушка */}
          <span className="feed-search-sliders">
            <span />
            <span />
          </span>
        </button>
      </div>

      {/* Ряд: слева фильтры, справа сортировка */}
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
          <span className="feed-link">Скоро добавим кнопку для пациентов</span>
        </p>
      </footer>

      <style jsx>{`
        .feed {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px);
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

        /* Кнопка в том же стиле, что и в гамбургере */
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

        /* ====== ПОИСК ====== */

        .feed-search-wrap {
          margin-top: 10px;
        }

        .feed-search-box {
          width: 100%;
          padding: 10px 14px;
          border-radius: 999px;
          border: none;
          background: #111827;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .feed-search-icon {
          font-size: 16px;
          opacity: 0.85;
        }

        .feed-search-placeholder {
          flex: 1;
          text-align: left;
          font-size: 14px;
          color: rgba(243, 244, 246, 0.7);
        }

        .feed-search-sliders {
          display: inline-flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
        }

        .feed-search-sliders span {
          width: 16px;
          height: 2px;
          border-radius: 999px;
          background: #f9fafb;
        }

        /* ====== ФИЛЬТРЫ / СОРТИРОВКА ====== */

        .feed-filters-row {
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .pill-btn {
          flex: 1;
          padding: 8px 10px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid transparent;
          background: #ffffff;
          color: #111827;
          -webkit-tap-highlight-color: transparent;
          cursor: pointer;
        }

        .pill-btn--ghost {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.06);
        }

        .pill-btn--outline {
          background: #ffffff;
          border-color: rgba(36, 199, 104, 0.5);
          color: #059669;
        }

        .pill-btn:active {
          transform: translateY(1px);
          opacity: 0.85;
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
