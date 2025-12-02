/* path: components/TopBar.tsx */
'use client';

import Hamburger from './Hamburger';

export default function TopBar() {
  return (
    <>
      <div className="app-topbar">
        <div className="app-topbar-row">
          <div className="app-logo">
            <span className="app-logo-main">ВРАЧИ</span>
            <span className="app-logo-dot">.</span>
            <span className="app-logo-accent">ТУТ</span>
          </div>

          <Hamburger />
        </div>
      </div>

      <style jsx>{`
        .app-topbar {
          position: sticky;
          /* отпускаем ниже телеграм-хедера */
          top: calc(env(safe-area-inset-top, 0px) + 52px);
          z-index: 1000;
          background: linear-gradient(
            to bottom,
            rgba(248, 250, 252, 0.98),
            rgba(248, 250, 252, 0.92),
            rgba(248, 250, 252, 0)
          );
          margin: 0 0 4px;
          padding-bottom: 8px;
        }

        .app-topbar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
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
