/* path: components/TopBarBack.tsx */
'use client';

import BackBtn from './BackBtn';
import Hamburger from './Hamburger';

export default function TopBarBack() {
  return (
    <>
      <div className="app-topbar">
        <div className="app-topbar-row app-topbar-row--back">
          {/* Слева — текст "← Назад" */}
          <div className="topbar-left">
            <BackBtn fallback="/" label="Назад" />
          </div>

          {/* По центру — ВРАЧИ.ТУТ как в обычном TopBar */}
          <div className="app-logo">
            <span className="app-logo-main">ВРАЧИ</span>
            <span className="app-logo-dot">.</span>
            <span className="app-logo-accent">ТУТ</span>
          </div>

          {/* Справа — гамбургер */}
          <div className="topbar-right">
            <Hamburger />
          </div>
        </div>
      </div>

      <style jsx>{`
        .app-topbar {
          position: sticky;
          top: calc(env(safe-area-inset-top, 0px) + 52px);
          z-index: 1000;

          /* как на главной: растягиваем за счёт отступов main (16px) */
          margin: 0 -16px 8px;
          padding: 10px 16px 12px;

          background: #ffffff;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
        }

        .app-topbar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        /* Режим с back-текстом: логотип по центру, края — absolute */
        .app-topbar-row--back {
          position: relative;
          justify-content: center;
        }

        .topbar-left,
        .topbar-right {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
        }

        .topbar-left {
          left: 16px; /* прям в левый край панели */
        }

        .topbar-right {
          right: 16px;
        }

        /* Наш текст "Назад" — просто текст, но кликабельный */
        .back-text {
          font-size: 14px;
          font-weight: 500;
          color: #0b0c10;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .back-text:active {
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
          font-size: 26px;
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
