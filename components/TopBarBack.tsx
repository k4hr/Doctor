/* path: components/TopBarBack.tsx */
'use client';

import BackBtn from './BackBtn';

export default function TopBarBack() {
  return (
    <>
      <div className="app-topbar app-topbar--back">
        <div className="app-topbar-row app-topbar-row--back">
          {/* Левая зона — системная кнопка "Назад" */}
          <div className="topbar-backwrap">
            <BackBtn fallback="/" label="Назад" />
          </div>

          {/* Заголовок по центру */}
          <div className="app-logo app-logo--center">
            <span className="app-logo-main">ВРАЧИ</span>
            <span className="app-logo-dot">.</span>
            <span className="app-logo-accent">ТУТ</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .app-topbar {
          position: sticky;
          top: calc(env(safe-area-inset-top, 0px) + 52px);
          z-index: 1000;

          /* растягиваем панель на ширину экрана за счёт паддинга main (16px) */
          margin: 0 -16px 8px;
          padding: 10px 16px 12px;

          background: #ffffff;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
        }

        .app-topbar-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Вариант с back-кнопкой — центрируем заголовок */
        .app-topbar-row--back {
          position: relative;
          justify-content: center;
        }

        .topbar-backwrap {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
        }

        /* Перестилизуем BackBtn ровно под хедер */
        .topbar-backwrap .list-btn {
          margin: 0;
          max-width: none;
          padding: 6px 10px;
          border-radius: 999px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          color: #0b0c10;
        }

        .topbar-backwrap .list-btn:active {
          opacity: 0.7;
          transform: translateX(-1px);
        }

        .app-logo {
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI',
            sans-serif;
          font-weight: 900;
          font-size: 22px;
          letter-spacing: -0.02em;
        }

        .app-logo-main,
        .app-logo-dot {
          color: #0b0c10;
        }

        .app-logo-accent {
          color: #24c768;
        }
      `}</style>
    </>
  );
}
