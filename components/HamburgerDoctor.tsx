'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

/** Лочим скролл */
function lockBodyScroll() {
  try {
    const scrollY =
      window.scrollY ||
      document.documentElement.scrollTop ||
      (document.body as any).scrollTop ||
      0;

    (document.body as any).dataset.scrollY = String(scrollY);

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  } catch {}
}

function unlockBodyScroll() {
  try {
    const scrollYStr = (document.body as any).dataset.scrollY;

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    delete (document.body as any).dataset.scrollY;

    if (scrollYStr) {
      const y = parseInt(scrollYStr, 10);
      if (!Number.isNaN(y)) window.scrollTo(0, y);
    }
  } catch {}
}

export default function HamburgerDoctor() {
  const router = useRouter();
  const pathname = usePathname();

  const closeMenu = () => {
    try {
      document.body.classList.remove('menu-open-doctor');
    } catch {}
    unlockBodyScroll();
  };

  const openMenu = () => {
    haptic('light');
    document.body.classList.add('menu-open-doctor');
    lockBodyScroll();
  };

  const go = (path: string, h: 'light' | 'medium' = 'light') => {
    haptic(h);
    closeMenu();
    router.push(path);
  };

  useEffect(() => {
    closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    return () => closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <button type="button" className="menu-btn-doctor" onClick={openMenu} aria-label="Меню врача">
        <span />
        <span />
        <span />
      </button>

      <div className="menu-overlay-doctor" onClick={closeMenu} />

      <aside className="side-menu-doctor" aria-label="Меню врача">
        <button type="button" className="side-close-doctor" onClick={closeMenu} aria-label="Закрыть">
          ✕
        </button>

        <div className="side-inner-doctor">
          <button
            type="button"
            className="side-primary-btn-doctor"
            onClick={() => go('/hamburger/doctor/questions', 'medium')}
          >
            Вопросы
          </button>

          <nav className="side-items-doctor">
            <button type="button" onClick={() => go('/hamburger/doctor/questions')}>Вопросы</button>
            <button type="button" onClick={() => go('/hamburger/doctor/consultations')}>Консультации</button>
            <button type="button" onClick={() => go('/hamburger/doctor/profile')}>Профиль врача</button>
          </nav>

          <button
            type="button"
            className="side-secondary-btn-doctor"
            onClick={() => go('/hamburger/profile', 'light')}
          >
            Я пациент
          </button>
        </div>
      </aside>

      <style jsx global>{`
        .menu-btn-doctor {
          width: 32px;
          height: 26px;
          border: none;
          background: transparent;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .menu-btn-doctor span {
          height: 3px;
          width: 100%;
          background: #0b0c10;
          border-radius: 2px;
        }

        .menu-overlay-doctor {
          position: fixed;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          transition: opacity 0.25s;
          z-index: 9998;
        }

        .side-menu-doctor {
          position: fixed;
          top: 0;
          right: -100%;
          width: 78%;
          max-width: 360px;
          height: 100%;
          background: #ffffff;
          transition: right 0.28s ease;
          z-index: 9999;
          box-shadow: -4px 0 22px rgba(0, 0, 0, 0.12);
        }

        .side-close-doctor {
          position: absolute;
          top: calc(env(safe-area-inset-top) + 56px);
          right: 18px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .side-inner-doctor {
          height: 100%;
          padding: calc(env(safe-area-inset-top) + 130px) 20px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .side-primary-btn-doctor {
          width: 100%;
          max-width: 260px;
          padding: 14px;
          border-radius: 999px;
          background: #24c768;
          color: #fff;
          font-weight: 800;
          border: none;
          margin-bottom: 32px;
          -webkit-tap-highlight-color: transparent;
        }

        .side-items-doctor {
          width: 100%;
          max-width: 260px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          text-align: center;
        }

        .side-items-doctor button {
          border: none;
          background: none;
          font-size: 16px;
          color: #374151;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .side-secondary-btn-doctor {
          margin-top: 40px;
          width: 100%;
          max-width: 260px;
          padding: 14px;
          border-radius: 999px;
          border: 1.5px solid rgba(15, 23, 42, 0.14);
          background: #fff;
          color: #111827;
          font-weight: 900;
          -webkit-tap-highlight-color: transparent;
        }

        body.menu-open-doctor .menu-overlay-doctor {
          opacity: 1;
          pointer-events: auto;
        }

        body.menu-open-doctor .side-menu-doctor {
          right: 0;
        }
      `}</style>
    </>
  );
}
