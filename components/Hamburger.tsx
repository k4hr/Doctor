/* path: components/Hamburger.tsx */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

function isMenuOpen() {
  try {
    return document.body.classList.contains('menu-open');
  } catch {
    return false;
  }
}

export default function Hamburger() {
  const router = useRouter();

  const closeMenu = () => {
    try {
      document.body.classList.remove('menu-open');
    } catch {}
    unlockBodyScroll();
  };

  const openMenu = () => {
    haptic('light');
    try {
      document.body.classList.add('menu-open');
    } catch {}
    lockBodyScroll();
  };

  const go = (path: string, h: 'light' | 'medium' = 'light') => {
    haptic(h);
    closeMenu();          // важно закрыть ДО push
    router.push(path);
  };

  // ✅ КЛЮЧЕВОЕ: очистка при монтировании/размонтировании
  useEffect(() => {
    // если класс уже "залип" откуда-то — лечим сразу
    if (isMenuOpen()) closeMenu();

    // при размонтировании страницы (route change) — гарантированно убираем оверлей/лок
    return () => {
      closeMenu();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ закрытие по Escape (удобно в браузере)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Кнопка три полоски */}
      <button type="button" className="menu-btn" onClick={openMenu} aria-label="Меню">
        <span />
        <span />
        <span />
      </button>

      {/* Затемнение */}
      <div className="menu-overlay" onClick={closeMenu} />

      {/* Шторка */}
      <aside className="side-menu" aria-hidden={!isMenuOpen()}>
        <button type="button" className="side-close" onClick={closeMenu} aria-label="Закрыть">
          ✕
        </button>

        <div className="side-inner">
          <button
            type="button"
            className="side-primary-btn"
            onClick={() => go('/vopros', 'medium')}
          >
            Задать вопрос
          </button>

          <nav className="side-items">
            <button type="button" onClick={() => go('/hamburger/profile')}>Мой профиль</button>
            <button type="button" onClick={() => go('/hamburger/consultations')}>Консультации</button>
            <button type="button" onClick={() => go('/hamburger/vrachi')}>Врачи</button>
            <button type="button" onClick={() => go('/hamburger/help')}>Помощь</button>
            <button type="button" onClick={() => go('/hamburger/about')}>О нас</button>
            <button type="button" onClick={() => go('/hamburger/contacts')}>Контакты</button>
          </nav>

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
          -webkit-tap-highlight-color: transparent;
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
