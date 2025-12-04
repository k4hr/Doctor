/* path: components/DownBarUtil/vozmojnosti.tsx */
'use client';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

type ModeCard = {
  id: number;
  title: string;
  subtitle: string;
  price: string;
  features: { good?: boolean; text: string }[];
  color: 'gray' | 'gold' | 'red';
};

const MODES: ModeCard[] = [
  {
    id: 1,
    title: 'Диагноз',
    subtitle: 'Бесплатный режим',
    price: 'Бесплатно',
    color: 'gray',
    features: [
      { good: true, text: 'Вопрос попадает в общую очередь' },
      { good: false, text: 'Нет гарантии получения ответа' },
      { good: true, text: 'Среднее время публикации около 2-3 часов' },
    ],
  },
  {
    id: 2,
    title: 'Диагноз+',
    subtitle: 'Популярный режим',
    price: 'от ₽',
    color: 'gold',
    features: [
      { good: true, text: 'Мгновенная публикация вопроса' },
      { good: true, text: 'Ответы сразу от нескольких врачей' },
      { good: true, text: 'Первые ответы обычно в течение 15 минут' },
      { good: true, text: 'Можно приложить снимки и анализы' },
    ],
  },
  {
    id: 3,
    title: 'Консультация',
    subtitle: 'Индивидуальный подход',
    price: 'от 1000 ₽',
    color: 'red',
    features: [
      { good: true, text: 'Подробная консультация одного выбранного врача' },
      { good: true, text: 'Работа только с опытным специалистом' },
      { good: true, text: 'Полностью персональный подход' },
      { good: true, text: 'Конфиденциальный чат-диалог' },
    ],
  },
];

export default function VozmojnostiBlock() {
  return (
    <>
      <section className="vozmo">
        <h2 className="vozmo-title">Возможности сервиса</h2>

        <div className="vozmo-slider">
          {MODES.map((m) => (
            <div
              key={m.id}
              className={`vozmo-card vozmo-card--${m.color}`}
              onClick={() => haptic('light')}
            >
              <div className={`vozmo-badge vozmo-badge--${m.color}`}>
                {m.title}
              </div>

              <h3 className="vozmo-mode">{m.subtitle}</h3>

              <ul className="vozmo-features">
                {m.features.map((f, i) => (
                  <li key={i} className="vozmo-feature">
                    {f.good ? (
                      <span className="feat-icon yes">✔</span>
                    ) : (
                      <span className="feat-icon no">✖</span>
                    )}
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>

              <div className="vozmo-price">{m.price}</div>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        .vozmo {
          margin-top: 28px;
        }

        .vozmo-title {
          font-size: 22px;
          font-weight: 900;
          text-align: center;
          margin-bottom: 20px;
          color: #111827;
        }

        .vozmo-slider {
          display: flex;
          overflow-x: auto;
          gap: 16px;
          padding-bottom: 8px;
          scroll-snap-type: x mandatory;
        }

        .vozmo-slider::-webkit-scrollbar {
          display: none;
        }

        .vozmo-card {
          min-width: 82%;
          border-radius: 22px;
          padding: 20px 18px 22px;
          scroll-snap-align: center;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #ffffff;
          /* одна маленькая чёрная тень для всех */
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
        }

        /* ===== Цветовые варианты карточек (без цветных теней) ===== */

        .vozmo-card--gray {
          background: radial-gradient(
            circle at top left,
            #f9fafb 0,
            #f3f4f6 45%,
            #ffffff 85%
          );
          border-color: rgba(148, 163, 184, 0.5);
        }

        .vozmo-card--gold {
          background: radial-gradient(
            circle at top left,
            #fffbeb 0,
            #fef3c7 45%,
            #ffffff 90%
          );
          border-color: rgba(217, 119, 6, 0.5);
        }

        .vozmo-card--red {
          background: radial-gradient(
            circle at top left,
            #fef2f2 0,
            #fee2e2 45%,
            #ffffff 90%
          );
          border-color: rgba(220, 38, 38, 0.5);
        }

        .vozmo-badge {
          font-size: 20px;
          font-weight: 800;
          text-align: center;
          padding: 8px 0;
          border-radius: 18px;
          margin-bottom: 10px;
          border: 1px solid transparent;
        }

        .vozmo-badge--gray {
          background: rgba(243, 244, 246, 0.95);
          border-color: rgba(148, 163, 184, 0.6);
          color: #374151;
        }

        .vozmo-badge--gold {
          background: rgba(254, 243, 199, 0.96);
          border-color: rgba(217, 119, 6, 0.8);
          color: #b45309;
        }

        .vozmo-badge--red {
          background: rgba(254, 226, 226, 0.96);
          border-color: rgba(220, 38, 38, 0.85);
          color: #b91c1c;
        }

        .vozmo-mode {
          font-size: 15px;
          text-align: center;
          margin: 4px 0 14px;
          color: rgba(55, 65, 81, 0.9);
        }

        .vozmo-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .vozmo-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #374151;
        }

        .feat-icon {
          font-size: 16px;
          width: 20px;
          text-align: center;
        }

        .feat-icon.yes {
          color: #16a34a;
        }

        .feat-icon.no {
          color: #dc2626;
        }

        .vozmo-price {
          margin-top: 18px;
          font-size: 18px;
          font-weight: 800;
          text-align: center;
          color: #111827;
        }
      `}</style>
    </>
  );
}
