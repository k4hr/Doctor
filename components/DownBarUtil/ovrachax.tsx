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
  color: 'blue' | 'green' | 'yellow';
};

const FEATURES: Feature[] = [
  {
    id: 1,
    label: '01',
    title: 'Широкий выбор специалистов',
    description: 'Врачи почти всех направлений — от терапевта до узких профилей.',
    color: 'blue',
  },
  {
    id: 2,
    label: '02',
    title: 'Подтверждённое образование',
    description: 'Документы проверяются администрацией сервиса перед допуском к приёму.',
    color: 'green',
  },
  {
    id: 3,
    label: '03',
    title: 'Рейтинг по отзывам пациентов',
    description: 'Оценка врача формируется на основе реальных консультаций.',
    color: 'yellow',
  },
];

export default function OvrachaxBlock() {
  const handleAskClick = () => {
    haptic('medium');
    // TODO: переход на страницу вопроса /vopros
    console.log('go to /vopros');
  };

  return (
    <>
      <section className="ovrachax">
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
        }

        .ovrachax-circle span {
          transform: translateY(2px);
        }

        .ovrachax-circle--blue {
          border: 8px solid rgba(59, 130, 246, 0.25);
          border-top-color: rgba(59, 130, 246, 0.8);
          color: rgba(37, 99, 235, 1);
        }

        .ovrachax-circle--green {
          border: 8px solid rgba(34, 197, 94, 0.25);
          border-top-color: rgba(34, 197, 94, 0.8);
          color: rgba(22, 163, 74, 1);
        }

        .ovrachax-circle--yellow {
          border: 8px solid rgba(234, 179, 8, 0.25);
          border-top-color: rgba(234, 179, 8, 0.9);
          color: rgba(202, 138, 4, 1);
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
