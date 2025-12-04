/* path: components/DownBarUtil/ovrachax.tsx */
'use client';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

type Feature = {
  id: number;
  label: string;
  title: string;
  description: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
};

const FEATURES: Feature[] = [
  {
    id: 1,
    label: '1',
    title: 'Широкий выбор специалистов',
    description:
      'Врачи почти всех направлений — от терапевта до узких профилей.',
    color: 'blue',
  },
  {
    id: 2,
    label: '2',
    title: 'Подтверждённое образование',
    description:
      'Документы проверяются администрацией сервиса перед допуском к приёму.',
    color: 'green',
  },
  {
    id: 3,
    label: '3',
    title: 'Рейтинг по отзывам пациентов',
    description:
      'Оценка врача формируется на основе реальных консультаций.',
    color: 'yellow',
  },
  {
    id: 4,
    label: '4',
    title: 'Всегда есть врач онлайн',
    description:
      'Часть специалистов дежурит постоянно, поэтому ваш вопрос не останется без внимания.',
    color: 'red',
  },
];

export default function OvrachaxBlock() {
  const handleAskClick = () => {
    haptic('medium');
    // TODO: реальный переход на /vopros
    console.log('go to /vopros');
  };

  return (
    <>
      <section className="ovrachax">
        <header className="ovrachax-header">
          <h2>Квалифицированные консультации врачей</h2>
        </header>

        {FEATURES.map((f) => (
          <div key={f.id} className="ovrachax-item">
            <div className={`ovrachax-circle ovrachax-circle--${f.color}`}>
              <span>{f.label}</span>
            </div>
            <div className="ovrachax-text">
              <h3 className="ovrachax-title">{f.title}</h3>
              <p className="ovrachax-desc">{f.description}</p>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="ovrachax-button"
          onClick={handleAskClick}
        >
          Задать вопрос врачу
        </button>
      </section>

      <style jsx>{`
        .ovrachax {
          margin-top: 24px;
          margin-bottom: 8px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: center;
          text-align: center;
          font-family: Montserrat, Manrope, system-ui, -apple-system,
            'Segoe UI', sans-serif;
        }

        .ovrachax-header {
          margin-bottom: 4px;
        }

        .ovrachax-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #111827;
        }

        .ovrachax-item {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .ovrachax-circle {
          width: 120px;
          height: 120px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          font-weight: 800;
          border-width: 8px;
          border-style: solid;
          /* базовая прозрачная обводка, дальше переопределяем стороны */
          border-color: rgba(148, 163, 184, 0.12);
        }

        .ovrachax-circle span {
          transform: translateY(2px);
        }

        /* 1 — синий, жирный сегмент смотрит ВВЕРХ */
        .ovrachax-circle--blue {
          border-top-color: rgba(59, 130, 246, 0.9);
          border-right-color: rgba(59, 130, 246, 0.2);
          border-bottom-color: rgba(59, 130, 246, 0.1);
          border-left-color: rgba(59, 130, 246, 0.2);
          color: rgba(37, 99, 235, 1);
        }

        /* 2 — зелёный, жирный сегмент смотрит ВПРАВО */
        .ovrachax-circle--green {
          border-right-color: rgba(34, 197, 94, 0.9);
          border-bottom-color: rgba(34, 197, 94, 0.2);
          border-left-color: rgba(34, 197, 94, 0.1);
          border-top-color: rgba(34, 197, 94, 0.2);
          color: rgba(22, 163, 74, 1);
        }

        /* 3 — жёлтый, жирный сегмент смотрит ВНИЗ */
        .ovrachax-circle--yellow {
          border-bottom-color: rgba(234, 179, 8, 0.95);
          border-left-color: rgba(234, 179, 8, 0.25);
          border-top-color: rgba(234, 179, 8, 0.12);
          border-right-color: rgba(234, 179, 8, 0.25);
          color: rgba(202, 138, 4, 1);
        }

        /* 4 — красный, жирный сегмент смотрит ВЛЕВО */
        .ovrachax-circle--red {
          border-left-color: rgba(239, 68, 68, 0.95);
          border-top-color: rgba(239, 68, 68, 0.25);
          border-right-color: rgba(239, 68, 68, 0.12);
          border-bottom-color: rgba(239, 68, 68, 0.25);
          color: rgba(185, 28, 28, 1);
        }

        .ovrachax-text {
          max-width: 320px;
        }

        .ovrachax-title {
          margin: 0 0 4px;
          font-size: 17px;
          font-weight: 800;
          color: #111827;
        }

        .ovrachax-desc {
          margin: 0;
          font-size: 13px;
          line-height: 1.4;
          color: rgba(75, 85, 99, 0.95);
        }

        .ovrachax-button {
          margin-top: 4px;
          width: 100%;
          max-width: 320px;
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
          box-shadow: 0 12px 26px rgba(36, 199, 104, 0.4);
        }

        .ovrachax-button:active {
          transform: scale(0.98);
          box-shadow: 0 8px 18px rgba(36, 199, 104, 0.45);
        }
      `}</style>
    </>
  );
}
