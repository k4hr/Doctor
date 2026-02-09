/* path: components/TopBar.tsx */
'use client';

import { useRouter } from 'next/navigation';
import Hamburger from './Hamburger';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

export default function TopBar() {
  const router = useRouter();

  const goHome = () => {
    haptic('light');
    router.push('/');
  };

  return (
    <>
      <div className="app-topbar">
        <div className="app-topbar-row">
          <button type="button" className="app-logo-btn" onClick={goHome} aria-label="На главную">
            <span className="app-logo">
              <span className="app-logo-main">ВРАЧИ</span>
              <span className="app-logo-dot">.</span>
              <span className="app-logo-accent">ТУТ</span>
            </span>
          </button>

          <Hamburger />
        </div>
      </div>

      <style jsx>{`
        .app-topbar {
          position: sticky;
          top: 0;
          z-index: 1000;

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

        .app-logo-btn {
          border: 0;
          background: transparent;
          padding: 0;
          margin: 0;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .app-logo {
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif;
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

        .app-logo-btn:active {
          transform: scale(0.995);
          opacity: 0.92;
        }
      `}</style>
    </>
  );
}
