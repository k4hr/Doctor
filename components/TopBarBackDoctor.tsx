'use client';

import BackBtn from './BackBtn';
import HamburgerDoctor from './HamburgerDoctor';

export default function TopBarBackDoctor() {
  return (
    <>
      <div className="app-topbar app-topbar--back-doctor">
        <div className="app-topbar-row app-topbar-row--back-doctor">
          <div className="topbar-left">
            <BackBtn fallback="/hamburger/doctor/profile" label="Назад" />
          </div>

          <div className="app-logo app-logo--center" aria-label="ВРАЧИ.ТУТ">
            <span className="app-logo-main">ВРАЧИ</span>
            <span className="app-logo-dot">.</span>
            <span className="app-logo-accent">ТУТ</span>
          </div>

          <div className="topbar-right">
            <HamburgerDoctor />
          </div>
        </div>
      </div>

      <style jsx>{`
        .app-topbar {
          position: sticky;
          top: env(safe-area-inset-top, 0px);
          z-index: 1000;

          margin: 0 -16px 8px;
          padding: 10px 16px 12px;

          background: #ffffff;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
          pointer-events: none;
        }

        .app-topbar-row {
          display: flex;
          align-items: center;
          pointer-events: auto;
        }

        .app-topbar-row--back-doctor {
          justify-content: space-between;
        }

        .topbar-left,
        .topbar-right {
          min-width: 64px;
          display: flex;
          align-items: center;
          pointer-events: auto;
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
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-weight: 900;
          font-size: 26px;
          letter-spacing: -0.02em;
          pointer-events: none;
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
      `}</style>
    </>
  );
}
