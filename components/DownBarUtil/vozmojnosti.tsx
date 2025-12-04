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
      { good: true, text: 'Вопрос попадает в очередь общих консультаций' },
      { good: false, text: 'Нет гарантии получения ответа' },
      { good: true, text: 'Среднее время публикации около 7 часов' },
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
      { good: true, text: 'Первые комментарии обычно в течение 15 минут' },
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
      { good: true, text: 'Работа только со специалистом высокого уровня' },
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
            <div key={m.id} className="vozmo-card">
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
          background: white;
          border-radius: 20px;
          padding: 20px 18px;
          box-shadow: 0 8px 26px rgba(0, 0, 0, 0.08);
          scroll-snap-align: center;
        }

        .vozmo-badge {
          font-size: 20px;
          font-weight: 800;
          text-align: center;
          padding: 8px 0;
          border-radius: 14px;
          margin-bottom: 8px;
        }

        .vozmo-badge--gray {
          background: #f3f4f6;
          color: #4b5563;
        }

        .vozmo-badge--gold {
          background: #fff3c4;
          color: #b45309;
        }

        .vozmo-badge--red {
          background: #fee2e2;
          color: #b91c1c;
        }

        .vozmo-mode {
          font-size: 15px;
          text-align: center;
          margin: 4px 0 12px;
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
          margin-top: 16px;
          font-size: 18px;
          font-weight: 800;
          text-align: center;
          color: #111827;
        }
      `}</style>
    </>
  );
}
