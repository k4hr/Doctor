/* path: components/TopBarBack.tsx */
'use client';

import { useRouter } from 'next/navigation';
import BackBtn from './BackBtn';
import Hamburger from './Hamburger';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

export default function TopBarBack() {
  const router = useRouter();

  const goHome = () => {
    haptic('light');
    router.push('/');
  };

  return (
    <>
      <div className="app-topbar app-topbar--back">
        <div className="app-topbar-row app-topbar-row--back">
          <div className="topbar-left">
            <BackBtn fallback="/" label="Назад" />
          </div>

          <button
            type="button"
            className="app-logo-btn app-logo-btn--center"
            onClick={goHome}
            aria-label="На главную"
          >
            <span className="app-logo">
              <span className="app-logo-main">ВРАЧИ</span>
              <span className="app-logo-dot">.</span>
              <span className="app-logo-accent">ТУТ</span>
            </span>
          </button>

          <div className="topbar-right">
            <Hamburger />
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ✅ НИКАКИХ отрицательных margin — они и раздувают ширину */
        .app-topbar {
          position: sticky;
          top: 0;
          z-index: 1000;

          width: 100%;
          max-width: 100%;

          margin: 0 0 8px;
          padding: 10px 12px 12px;

          background: #ffffff;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);

          overflow: hidden;
        }

        .app-topbar-row {
          display: flex;
          align-items: center;
          gap: 12px;

          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        .app-topbar-row--back {
          justify-content: space-between;
        }

        .topbar-left,
        .topbar-right {
          min-width: 64px;
          display: flex;
          align-items: center;
          flex: 0 0 auto;
        }

        .topbar-left {
          justify-content: flex-start;
        }

        .topbar-right {
          justify-content: flex-end;
        }

        .app-logo-btn {
          border: 0;
          background: transparent;
          padding: 0;
          margin: 0;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;

          flex: 1 1 auto;
          min-width: 0;

          display: flex;
          justify-content: center;
        }

        .app-logo {
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-weight: 900;
          font-size: 26px;
          letter-spacing: -0.02em;

          max-width: 100%;
          white-space: nowrap;
        }

        .app-logo-main,
        .app-logo-dot {
          color: #0b0c10;
        }

        .app-logo-accent {
          color: #24c768;
        }

        .app-logo-btn:active {
          transform: scale(0.995);
          opacity: 0.92;
        }
      `}</style>
    </>
  );
}
