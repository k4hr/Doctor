/* path: components/TopBarBack.tsx */
'use client';

import BackBtn from './BackBtn';
import Hamburger from './Hamburger';

export default function TopBarBack() {
  return (
    <>
      <div className="app-topbar app-topbar--back">
        <div className="app-topbar-row app-topbar-row--back">
          {/* Левая зона — кнопка "Назад" */}
          <div className="topbar-backwrap">
            <BackBtn fallback="/" label="Назад" />
          </div>

          {/* Центральный логотип */}
          <div className="app-logo app-logo--center">
            <span className="app-logo-main">ВРАЧИ</span>
            <span className="app-logo-dot">.</span>
            <span className="app-logo-accent">ТУТ</span>
          </div>

          {/* Правая зона — гамбургер */}
          <div className="topbar-menuwrap">
            <Hamburger />
          </div>
        </div>
      </div>

      <style jsx>{`
        .app-topbar {
          position: sticky;
          top: calc(env(safe-area-inset-top, 0px) + 52px);
          z-index: 1000;

          /* как на главной: растягиваем за счёт паддингов main (16px) */
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

        /* Центрируем логотип, а кнопки слева/справа кладём абсолютом */
        .app-topbar-row--back {
          position: relative;
          justify-content: center;
        }

        .topbar-backwrap,
        .topbar-menuwrap {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
        }

        .topbar-backwrap {
          left: 16px;
        }

        .topbar-menuwrap {
          right: 16px;
        }

        /* Причесываем BackBtn под хедер: убираем карточку, оставляем текст */
        .topbar-backwrap .list-btn {
          margin: 0;
          max-width: none;
          padding: 0;
          border: none;
          background: transparent;
          box-shadow: none;
          border-radius: 0;

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
