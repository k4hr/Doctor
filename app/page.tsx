/* path: app/page.tsx */
'use client';

import { useEffect } from 'react';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

function setCookie(k: string, v: string) {
  try {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${k}=${encodeURIComponent(
      v,
    )}; Path=/; Max-Age=${maxAge}; SameSite=None; Secure`;
  } catch {}
}

export default function LandingPage() {
  useEffect(() => {
    const w: any = window;
    try {
      w?.Telegram?.WebApp?.ready?.();
      w?.Telegram?.WebApp?.expand?.();
    } catch {}
  }, []);

  const handlePatientStart = () => {
    setCookie('welcomed', '1');
    setCookie('role', 'patient');
    haptic('medium');
    // TODO: когда появится основной экран для пациентов,
    // добавить router.push('/client')
  };

  const handleDoctorStart = () => {
    setCookie('welcomed', '1');
    setCookie('role', 'doctor');
    haptic('medium');
    // TODO: когда появится кабинет врача,
    // добавить router.push('/doctor')
  };

  return (
    <main className="lp">
      <div className="lp-orb orb-tr" aria-hidden />
      <div className="lp-orb orb-bl" aria-hidden />

      <div className="lp-inner">
        <h1 className="lp-title">
          <span className="lp-logo">
            <span className="lp-logo-main">ВРАЧИ</span>
            <span className="lp-logo-dot">.</span>
            <span className="lp-logo-accent">ТУТ</span>
          </span>
        </h1>

        <p className="lp-subtitle">
          Онлайн-консультации с проверенными врачами
          <br />
          прямо внутри Telegram Mini App.
        </p>

        <div className="lp-actions">
          <button
            type="button"
            className="lp-cta lp-cta--glass lp-cta--primary"
            onClick={handlePatientStart}
          >
            Я ПАЦИЕНТ
            <span className="lp-cta-glow" aria-hidden />
          </button>

          <button
            type="button"
            className="lp-cta lp-cta--secondary"
            onClick={handleDoctorStart}
          >
            Я ВРАЧ
          </button>
        </div>
      </div>

      <style jsx>{`
        .lp {
          position: relative;
          min-height: 100dvh;
          padding: 24px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          display: grid;
          place-items: center;
          color: #0d1220;
          background: transparent;
          overflow: hidden;
        }

        .lp-inner {
          width: 100%;
          max-width: 860px;
          text-align: center;
        }

        .lp-title {
          margin: 0 0 12px;
          line-height: 1.06;
          font-size: clamp(42px, 9vw, 90px);
          font-weight: 900;
          letter-spacing: -0.02em;
          text-wrap: balance;
        }

        .lp-logo {
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI',
            sans-serif;
        }

        .lp-logo-main {
          color: #0b0c10;
        }

        .lp-logo-dot {
          color: #0b0c10;
        }

        .lp-logo-accent {
          color: #24c768; /* зелёный акцент */
        }

        .lp-subtitle {
          margin: 0 0 26px;
          font-size: 16px;
          line-height: 1.5;
          opacity: 0.8;
        }

        .lp-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
        }

        .lp-cta {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 16px 30px;
          border-radius: 18px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-decoration: none !important;
          color: #0d1220 !important;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          transition:
            transform 0.12s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease;
          isolation: isolate;
          touch-action: manipulation;
          border: none;
          cursor: pointer;
          width: 100%;
          max-width: 320px;
        }

        .lp-cta--primary {
          text-transform: uppercase;
        }

        .lp-cta--glass {
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(13, 18, 32, 0.14);
          box-shadow:
            0 14px 34px rgba(17, 23, 40, 0.14),
            inset 0 0 0 1px rgba(255, 255, 255, 0.55);
          backdrop-filter: saturate(160%) blur(14px);
          -webkit-backdrop-filter: saturate(160%) blur(14px);
        }

        .lp-cta--glass::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.65),
            rgba(255, 255, 255, 0) 55%
          );
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: 0.8;
        }

        .lp-cta--secondary {
          background: transparent;
          border-radius: 16px;
          border: 1px solid rgba(13, 18, 32, 0.12);
          box-shadow: 0 8px 22px rgba(17, 23, 40, 0.08);
          font-weight: 700;
        }

        .lp-cta-glow {
          position: absolute;
          inset: -22%;
          border-radius: 28px;
          background: radial-gradient(
            60% 60% at 50% 50%,
            rgba(255, 255, 255, 0.6),
            rgba(255, 255, 255, 0) 60%
          );
          filter: blur(18px);
          z-index: -1;
          pointer-events: none;
          animation: pulse 2.6s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.03);
          }
        }

        .lp-cta:hover {
          transform: translateY(-1px);
          box-shadow:
            0 18px 42px rgba(17, 23, 40, 0.18),
            inset 0 0 0 1px rgba(255, 255, 255, 0.6);
        }

        .lp-cta--secondary:hover {
          box-shadow: 0 14px 30px rgba(17, 23, 40, 0.12);
          background: rgba(255, 255, 255, 0.6);
        }

        .lp-cta:active {
          transform: translateY(0);
        }

        .lp-cta:focus-visible {
          outline: 0;
          box-shadow:
            0 0 0 3px rgba(26, 115, 232, 0.25),
            inset 0 0 0 1px rgba(255, 255, 255, 0.6);
        }

        @supports not (
          (backdrop-filter: blur(10px)) or
          (-webkit-backdrop-filter: blur(10px))
        ) {
          .lp-cta--glass {
            background: rgba(255, 255, 255, 0.95);
          }
        }

        .lp-orb {
          position: absolute;
          width: 60vmin;
          height: 60vmin;
          border-radius: 50%;
          filter: blur(48px);
          opacity: 0.16;
          pointer-events: none;
          background: radial-gradient(
            closest-side,
            #9aa7ff,
            transparent 70%
          );
        }

        .orb-tr {
          top: -18vmin;
          right: -18vmin;
        }

        .orb-bl {
          bottom: -22vmin;
          left: -22vmin;
        }

        @media (max-width: 420px) {
          .lp-cta {
            padding: 14px 24px;
            border-radius: 16px;
          }
        }
      `}</style>
    </main>
  );
}
