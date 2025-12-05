/* path: components/DownBarUtil/otzivi.tsx */
'use client';

import { useState } from 'react';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

type Review = {
  id: number;
  name: string;
  text: string;
};

const REVIEWS: Review[] = [
  {
    id: 1,
    name: 'Татьяна',
    text: 'Очень выручил сервис, несколько врачей ответили на мой вопрос в один вечер. Полезно и удобно.',
  },
  {
    id: 2,
    name: 'Николай',
    text: 'Получил понятное объяснение анализов и план действий. Спасибо врачам за спокойный тон.',
  },
  {
    id: 3,
    name: 'Ольга',
    text: 'Вопрос по ребёнку разобрали по шагам, стало намного спокойнее. Чувствуется реальный опыт врачей.',
  },
  {
    id: 4,
    name: 'Марина',
    text: 'Не могла попасть к специалисту в городе, а здесь ответ получила за пару часов. Очень помогли.',
  },
  {
    id: 5,
    name: 'Алексей',
    text: 'Подсказали, какие обследования точно нужны, а от каких можно отказаться. Сэкономил время и деньги.',
  },
  {
    id: 6,
    name: 'Екатерина',
    text: 'Хороший формат — задала вопрос вечером, утром уже были развёрнутые ответы от нескольких врачей.',
  },
  {
    id: 7,
    name: 'Дмитрий',
    text: 'Помогли разобраться, стоит ли вызывать скорую. Спокойно объяснили риски и дальнейшие шаги.',
  },
  {
    id: 8,
    name: 'Анна',
    text: 'Сервис оказался очень полезным в отпуске, когда рядом не было знакомых клиник. Спасибо!',
  },
  {
    id: 9,
    name: 'Ирина',
    text: 'Вежливые врачи, понятный язык без сложных терминов. Осталась довольна консультацией.',
  },
  {
    id: 10,
    name: 'Сергей',
    text: 'Подтвердили лечение, которое назначили в поликлинике, и предложили более мягкую схему.',
  },
  {
    id: 11,
    name: 'Юлия',
    text: 'Боялась зря беспокоить врача, но здесь быстро успокоили и объяснили, что опасно, а что нет.',
  },
  {
    id: 12,
    name: 'Владимир',
    text: 'Круто, что можно задать вопрос ночью и не ждать записи в клинику. Сервисом доволен.',
  },
  {
    id: 13,
    name: 'Алёна',
    text: 'Подробно разобрали результаты УЗИ, стало понятно, на что обращать внимание дальше.',
  },
  {
    id: 14,
    name: 'Галина',
    text: 'Спасибо за оперативность. Ответы были от разных специалистов, можно сравнить мнения.',
  },
  {
    id: 15,
    name: 'Роман',
    text: 'Сервис очень помог в нужный момент, когда не было возможности пойти к врачу офлайн.',
  },
];

export default function OtziviBlock() {
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    haptic('light');
    setIndex((prev) => (prev + 1) % REVIEWS.length);
  };

  const handlePrev = () => {
    haptic('light');
    setIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  };

  const current = REVIEWS[index];

  return (
    <>
      <section className="otzivi">
        <h2 className="otzivi-title">Отзывы наших пользователей</h2>

        <div className="otzivi-card-wrap">
          <article className="otzivi-card">
            <div className="otzivi-stars">★★★★★</div>

            <p className="otzivi-text">{current.text}</p>

            <div className="otzivi-user">
              <div className="otzivi-avatar" aria-hidden="true" />
              <span className="otzivi-name">{current.name}</span>
            </div>
          </article>
        </div>

        {/* Контролы: стрелки + точки в одной линии под карточкой */}
        <div className="otzivi-controls">
          <button
            type="button"
            className="otzivi-arrow"
            onClick={handlePrev}
            aria-label="Предыдущий отзыв"
          >
            ‹
          </button>

          <div className="otzivi-dots">
            {REVIEWS.map((r, i) => (
              <button
                key={r.id}
                type="button"
                className={
                  'otzivi-dot' + (i === index ? ' otzivi-dot--active' : '')
                }
                onClick={() => {
                  haptic('light');
                  setIndex(i);
                }}
                aria-label={`Перейти к отзыву ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="otzivi-arrow"
            onClick={handleNext}
            aria-label="Следующий отзыв"
          >
            ›
          </button>
        </div>
      </section>

      <style jsx>{`
        .otzivi {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI',
            sans-serif;
        }

        .otzivi-title {
          margin: 0 0 6px;
          font-size: 22px;
          line-height: 1.2;
          font-weight: 900;
          text-align: center;
          color: #111827;
          position: relative;
        }

        .otzivi-title::after {
          content: '';
          display: block;
          width: 80px;
          height: 3px;
          border-radius: 999px;
          background: #24c768;
          margin: 6px auto 0;
        }

        .otzivi-card-wrap {
          width: 100%;
          max-width: 420px;
        }

        .otzivi-card {
          background: #ffffff;
          border-radius: 22px;
          padding: 18px 18px 16px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
          min-height: 150px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .otzivi-stars {
          font-size: 16px;
          letter-spacing: 2px;
          color: #f59e0b;
          margin-bottom: 10px;
        }

        .otzivi-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #374151;
        }

        .otzivi-user {
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .otzivi-avatar {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 20%, #e5edff, #c4d4ff);
        }

        .otzivi-name {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        /* Стрелки + точки под карточкой */
        .otzivi-controls {
          margin-top: 6px;
          width: 100%;
          max-width: 420px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .otzivi-arrow {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          border: none;
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: #6b7280;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .otzivi-arrow:active {
          transform: scale(0.96);
          box-shadow: 0 3px 10px rgba(15, 23, 42, 0.18);
        }

        .otzivi-dots {
          flex: 1;
          display: flex;
          gap: 6px;
          justify-content: center;
        }

        .otzivi-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          border: none;
          background: rgba(156, 163, 175, 0.5);
          padding: 0;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .otzivi-dot--active {
          width: 10px;
          border-radius: 999px;
          background: #24c768;
        }
      `}</style>
    </>
  );
}
