/* path: components/TopBarBack.tsx */
'use client';

import BackBtn from './BackBtn';
import Hamburger from './Hamburger';

export default function TopBarBack() {
  return (
    <>
      <div className="app-topbar app-topbar--back">
        <div className="app-topbar-row app-topbar-row--back">
          {/* Слева — текст "Назад" */}
          <div className="topbar-left">
            <BackBtn fallback="/" label="Назад" />
          </div>

          {/* По центру — ВРАЧИ.ТУТ */}
          <div className="app-logo app-logo--center">
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

          margin: 0 -16px 8px;
          padding: 10px 16px 12px;

          background: #ffffff;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
        }

        .app-topbar-row {
          display: flex;
          align-items: center;
        }

        /* Три колонки: левый текст, центр-логотип, правый бургер */
        .app-topbar-row--back {
          justify-content: space-between;
        }

        .topbar-left,
        .topbar-right {
          min-width: 64px; /* одинаковая ширина слева/справа для идеального центра */
          display: flex;
          align-items: center;
        }

        .topbar-left {
          justify-content: flex-start;
        }

        .topbar-right {
          justify-content: flex-end;
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

        .app-logo--center {
          flex: 1;
          justify-content: center;
        }

        .app-logo-main,
        .app-logo-dot {
          color: #0b0c10;
        }

        .app-logo-accent {
          color: #24c768;
        }

        /* Аккуратный левый текст "Назад" */
        .back-text {
          font-size: 14px;
          font-weight: 500;
          color: rgba(11, 12, 16, 0.85);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .back-text:active {
          opacity: 0.7;
          transform: translateX(-1px);
        }
      `}</style>
    </>
  );
}
