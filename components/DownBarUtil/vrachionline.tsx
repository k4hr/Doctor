/* path: components/DownBarUtil/vrachionline.tsx */
'use client';

import { useRouter } from 'next/navigation';

export type Doctor = {
  id: number;
  name: string;
  speciality: string;
  experience: string;
  rating: string;
};

const DOCTORS_ONLINE: Doctor[] = [
  {
    id: 1,
    name: 'Константин Тищенко',
    speciality: 'Ортопед, Травматолог',
    experience: 'Стаж: 35 лет',
    rating: '5.0',
  },
  {
    id: 2,
    name: 'Елена Абрамович',
    speciality: 'Гинеколог, Акушер',
    experience: 'Стаж: 7 лет',
    rating: '5.0',
  },
  {
    id: 3,
    name: 'Марина Фатнева',
    speciality: 'Невролог, Рентгенолог',
    experience: 'Стаж: 5 лет',
    rating: '5.0',
  },
];

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

/** Блок "Врачи онлайн" для доунбара (заглушка) */
export default function VrachiOnlineBlock() {
  const router = useRouter();

  const handleDoctorClick = (id: number) => {
    haptic('light');
    console.log('open doctor', id);
  };

  const handleAllDoctorsClick = () => {
    haptic('medium');
    router.push('/hamburger/vrachi');
  };

  return (
    <>
      <section className="doconline">
        <header className="doconline-header">
          <h2 className="doconline-title">Врачи онлайн</h2>
          <span className="doconline-counter">369</span>
        </header>

        <div className="doconline-list">
          {DOCTORS_ONLINE.map((d) => (
            <button
              key={d.id}
              type="button"
              className="doconline-card"
              onClick={() => handleDoctorClick(d.id)}
            >
              <div className="doconline-avatar">
                <span>{d.name[0]}</span>
              </div>
              <div className="doconline-main">
                <div className="doconline-name-row">
                  <span className="doconline-name">{d.name}</span>
                  <span className="doconline-dot" />
                </div>
                <span className="doconline-spec">{d.speciality}</span>
                <div className="doconline-bottom">
                  <span className="doconline-exp">{d.experience}</span>
                  <span className="doconline-rating">⭐ {d.rating}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Кнопка "Все врачи" под списком */}
        <button
          type="button"
          className="doconline-all"
          onClick={handleAllDoctorsClick}
        >
          Все врачи
        </button>
      </section>

      <style jsx>{`
        .doconline {
          margin-top: 18px;
        }

        .doconline-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .doconline-title {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          color: #0b0c10;
        }

        .doconline-counter {
          padding: 2px 10px;
          border-radius: 999px;
          background: rgba(187, 247, 208, 0.9);
          color: #15803d;
          font-size: 13px;
          font-weight: 600;
        }

        .doconline-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .doconline-card {
          padding: 10px 12px;
          border-radius: 16px;
          border: 1px solid rgba(34, 197, 94, 0.22);
          background: rgba(220, 252, 231, 0.75);
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.16);
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          text-align: left; /* чтобы спец-ть была как у имени */
        }

        .doconline-card:active {
          transform: translateY(1px);
          box-shadow: 0 6px 16px rgba(22, 163, 74, 0.24);
        }

        .doconline-avatar {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          color: #16a34a;
          box-shadow: 0 4px 10px rgba(22, 163, 74, 0.3);
          flex-shrink: 0;
        }

        .doconline-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .doconline-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .doconline-name {
          font-size: 14px;
          font-weight: 700;
          color: #022c22;
        }

        .doconline-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.35);
          flex-shrink: 0;
        }

        .doconline-spec {
          font-size: 12px;
          color: rgba(15, 23, 42, 0.8);
        }

        .doconline-bottom {
          margin-top: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
        }

        .doconline-exp {
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.9);
          color: #15803d;
          font-weight: 500;
        }

        .doconline-rating {
          color: #166534;
          font-weight: 600;
        }

        .doconline-all {
          margin-top: 10px;
          width: 100%;
          padding: 10px 16px;
          border-radius: 999px;
          border: 1px solid rgba(34, 197, 94, 0.7);
          background: rgba(255, 255, 255, 0.96);
          color: #166534;
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 8px 18px rgba(22, 163, 74, 0.12);
        }

        .doconline-all:active {
          transform: scale(0.98);
          box-shadow: 0 5px 12px rgba(22, 163, 74, 0.2);
        }
      `}</style>
    </>
  );
}
