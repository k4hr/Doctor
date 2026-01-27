/* path: app/doctorhome/page.tsx */
'use client';

import { useEffect } from 'react';
import TopBarDoctor from '../../components/TopBarDoctor';

type Question = {
  id: number;
  title: string;
  snippet: string;
  status: 'new' | 'answering' | 'done';
  speciality: string;
  timeAgo: string;
};

const QUESTIONS: Question[] = [
  {
    id: 101,
    title: 'Температура у ребёнка 38.7',
    snippet: 'Вчера прививка, сегодня высокая температура и вялость. Давала Нурофен…',
    status: 'new',
    speciality: 'Педиатр',
    timeAgo: '2 мин назад',
  },
  {
    id: 102,
    title: 'Боль в груди при вдохе',
    snippet: 'Тянущая боль слева при глубоком вдохе, не могу понять, сердце это или мышца…',
    status: 'answering',
    speciality: 'Терапевт',
    timeAgo: '7 мин назад',
  },
  {
    id: 103,
    title: 'Сыпь после антибиотиков',
    snippet: 'Пил антибиотики 5 дней, появилась сыпь на руках и шее. Это аллергия?',
    status: 'done',
    speciality: 'Аллерголог',
    timeAgo: '21 мин назад',
  },
];

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

export default function DoctorHomePage() {
  useEffect(() => {
    try {
      (window as any)?.Telegram?.WebApp?.ready?.();
      (window as any)?.Telegram?.WebApp?.expand?.();
    } catch {}
  }, []);

  const openQuestion = (q: Question) => {
    haptic('light');
    console.log('open doctor question', q.id);
    // позже: router.push(`/doctorhome/q/${q.id}`)
  };

  return (
    <main className="feed">
      <TopBarDoctor />

      <section className="feed-main">
        <div className="feed-head">
          <h1 className="feed-title">Вопросы пациентов</h1>
          <p className="feed-sub">
            Тут будет лента вопросов по твоим специализациям. Пока мок-данные.
          </p>
        </div>

        <div className="feed-filters-row">
          <button type="button" className="pill-btn pill-btn--outline" onClick={() => haptic('light')}>
            Новые
          </button>
          <button type="button" className="pill-btn pill-btn--ghost" onClick={() => haptic('light')}>
            В работе
          </button>
          <button type="button" className="pill-btn pill-btn--ghost" onClick={() => haptic('light')}>
            Завершённые
          </button>
        </div>

        <section className="feed-list" aria-label="Вопросы пациентов">
          {QUESTIONS.map((q) => (
            <button key={q.id} type="button" className="q-card" onClick={() => openQuestion(q)}>
              <div className="q-top">
                <h2 className="q-title">{q.title}</h2>
                <span
                  className={
                    'q-status ' +
                    (q.status === 'new'
                      ? 'q-status--waiting'
                      : q.status === 'answering'
                      ? 'q-status--answering'
                      : 'q-status--done')
                  }
                >
                  {q.status === 'new' && 'Новый'}
                  {q.status === 'answering' && 'Вы отвечаете'}
                  {q.status === 'done' && 'Закрыт'}
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
          <p>Дальше добавим: фильтры по специализации, платно/бесплатно, “взять в работу”, чат/ответ.</p>
        </footer>
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

        .feed-head {
          margin-top: 2px;
        }

        .feed-title {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
          color: #111827;
        }

        .feed-sub {
          margin: 6px 0 0;
          font-size: 12px;
          line-height: 1.5;
          color: #6b7280;
        }

        .feed-filters-row {
          margin-top: 6px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .pill-btn {
          flex: 1;
          padding: 8px 0;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
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

        .feed-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 2px;
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
          font-weight: 800;
          color: #0b0c10;
        }

        .q-status {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid transparent;
          white-space: nowrap;
          font-weight: 800;
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
          font-weight: 700;
        }

        .q-time {
          color: rgba(15, 23, 42, 0.55);
          font-weight: 600;
        }

        .feed-footer {
          margin-top: 6px;
          font-size: 11px;
          color: rgba(15, 23, 42, 0.55);
          text-align: center;
        }
      `}</style>
    </main>
  );
}
