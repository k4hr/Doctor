/* path: components/Hamburger.tsx */
'use client';

import { useRouter } from 'next/navigation';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

/**
 * Лочим скролл
 */
function lockBodyScroll() {
  try {
    const scrollY =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    (document.body as any).dataset.scrollY = String(scrollY);

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
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
    delete (document.body as any).dataset.scrollY;

    if (scrollYStr) {
      const y = parseInt(scrollYStr, 10);
      if (!Number.isNaN(y)) window.scrollTo(0, y);
    }
  } catch {}
}

export default function Hamburger() {
  const router = useRouter();

  const openMenu = () => {
    haptic('light');
    document.body.classList.add('menu-open');
    lockBodyScroll();
  };

  const closeMenu = () => {
    document.body.classList.remove('menu-open');
    unlockBodyScroll();
  };

  const go = (path: string, h: 'light' | 'medium' = 'light') => {
    haptic(h);
    closeMenu();
    router.push(path);
  };

  return (
    <>
      {/* Кнопка три полоски */}
      <button type="button" className="menu-btn" onClick={openMenu}>
        <span />
        <span />
        <span />
      </button>

      {/* Затемнение */}
      <div className="menu-overlay" onClick={closeMenu} />

      {/* Шторка */}
      <aside className="side-menu">
        <button type="button" className="side-close" onClick={closeMenu}>
          ✕
        </button>

        <div className="side-inner">
          {/* Основная кнопка */}
          <button
            type="button"
            className="side-primary-btn"
            onClick={() => go('/vopros', 'medium')}
          >
            Задать вопрос
          </button>

          {/* Меню */}
          <nav className="side-items">
            <button onClick={() => go('/hamburger/profile')}>
              Мой профиль
            </button>

            <button onClick={() => go('/hamburger/consultations')}>
              Консультации
            </button>

            <button onClick={() => go('/hamburger/vrachi')}>
              Врачи
            </button>

            <button onClick={() => go('/hamburger/help')}>
              Помощь
            </button>

            <button onClick={() => go('/hamburger/about')}>
              О нас
            </button>

            <button onClick={() => go('/hamburger/contacts')}>
              Контакты
            </button>
          </nav>

          {/* Кнопка врачам */}
          <button
            type="button"
            className="side-doctor-btn"
            onClick={() => go('/hamburger/vracham', 'medium')}
          >
            Я врач
          </button>
        </div>
      </aside>

      <style jsx global>{`
        .menu-btn {
          width: 32px;
          height: 26px;
          border: none;
          background: transparent;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
        }

        .menu-btn span {
          height: 3px;
          width: 100%;
          background: #0b0c10;
          border-radius: 2px;
        }

        .menu-overlay {
          position: fixed;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          transition: opacity 0.25s;
          z-index: 9998;
        }

        .side-menu {
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

        .side-close {
          position: absolute;
          top: calc(env(safe-area-inset-top) + 56px);
          right: 18px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
        }

        .side-inner {
          height: 100%;
          padding: calc(env(safe-area-inset-top) + 130px) 20px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .side-primary-btn {
          width: 100%;
          max-width: 260px;
          padding: 14px;
          border-radius: 999px;
          background: #24c768;
          color: #fff;
          font-weight: 700;
          border: none;
          margin-bottom: 32px;
        }

        .side-items {
          width: 100%;
          max-width: 260px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          text-align: center;
        }

        .side-items button {
          border: none;
          background: none;
          font-size: 16px;
          color: #374151;
          cursor: pointer;
        }

        .side-doctor-btn {
          margin-top: 40px;
          width: 100%;
          max-width: 260px;
          padding: 14px;
          border-radius: 999px;
          border: 1.5px solid #22c55e;
          background: #fff;
          color: #22c55e;
          font-weight: 800;
          text-transform: uppercase;
        }

        body.menu-open .menu-overlay {
          opacity: 1;
          pointer-events: auto;
        }

        body.menu-open .side-menu {
          right: 0;
        }
      `}</style>
    </>
  );
}
