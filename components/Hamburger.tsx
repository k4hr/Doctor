/* path: components/Hamburger.tsx */
'use client';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

/**
 * Лочим скролл:
 *  - запоминаем текущий scrollY
 *  - фиксируем body
 *  - при закрытии возвращаем, как было
 */
function lockBodyScroll() {
  try {
    const scrollY =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    document.body.dataset.scrollY = String(scrollY);

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  } catch {}
}

function unlockBodyScroll() {
  try {
    const scrollYStr = document.body.dataset.scrollY;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    delete document.body.dataset.scrollY;

    if (scrollYStr) {
      const y = parseInt(scrollYStr, 10);
      if (!Number.isNaN(y)) {
        window.scrollTo(0, y);
      }
    }
  } catch {}
}

export default function Hamburger() {
  const openMenu = () => {
    haptic('light');
    try {
      document.body.classList.add('menu-open');
      lockBodyScroll();
    } catch {}
  };

  const closeMenu = () => {
    try {
      document.body.classList.remove('menu-open');
      unlockBodyScroll();
    } catch {}
  };

  return (
    <>
      {/* Кнопка "три полоски" */}
      <button type="button" className="menu-btn" onClick={openMenu}>
        <span />
        <span />
        <span />
      </button>

      {/* Затемнение фона */}
      <div className="menu-overlay" onClick={closeMenu} />

      {/* Правая шторка */}
      <aside className="side-menu">
        {/* Крестик в правом верхнем углу шторки */}
        <button type="button" className="side-close" onClick={closeMenu}>
          ✕
        </button>

        {/* Контейнер содержимого */}
        <div className="side-inner">
          {/* Зелёная кнопка "Задать вопрос" */}
          <button type="button" className="side-primary-btn">
            Задать вопрос
          </button>

          {/* Пункты меню */}
          <nav className="side-items">
            <button type="button">Консультации</button>
            <button type="button">Врач</button>
            <button type="button">Врачам</button>
            <button type="button">Помощь</button>
            <button type="button">О нас</button>
            <button type="button">Контакты</button>
          </nav>
        </div>
      </aside>

      <style jsx global>{`
        /* Кнопка в хедере */
        .menu-btn {
          width: 32px;
          height: 26px;
          padding: 0;
          border: none;
          background: transparent;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .menu-btn span {
          display: block;
          height: 3px;
          width: 100%;
          background: #0b0c10;
          border-radius: 2px;
          transition: 0.2s;
        }

        /* Затемнение */
        .menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
          z-index: 9998;
        }

        /* Белая шторка справа */
        .side-menu {
          position: fixed;
          top: 0;
          right: -100%;
          width: 78%;
          max-width: 360px;
          height: 100%;
          background: #ffffff;
          box-shadow: -4px 0 22px rgba(0, 0, 0, 0.12);
          transition: right 0.28s ease;
          z-index: 9999;
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI',
            sans-serif;
        }

        /* X в правом верхнем углу шторки — чёрный и ниже телеграм-меню */
        .side-close {
          position: absolute;
          top: calc(env(safe-area-inset-top, 0px) + 56px);
          right: 18px;
          border: none;
          background: transparent;
          padding: 4px;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          color: #0b0c10;
          -webkit-tap-highlight-color: transparent;
        }

        /* Контейнер контента шторки */
        .side-inner {
          height: 100%;
          padding: calc(env(safe-area-inset-top, 0px) + 80px) 20px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box;
        }

        /* Зелёная кнопка "Задать вопрос" */
        .side-primary-btn {
          width: 100%;
          max-width: 260px;
          padding: 14px 16px;
          border-radius: 999px;
          border: none;
          background: #24c768;
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          text-align: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 10px 20px rgba(36, 199, 104, 0.35);
          margin-bottom: 32px;
        }

        .side-primary-btn:active {
          transform: scale(0.98);
          box-shadow: 0 6px 14px rgba(36, 199, 104, 0.4);
        }

        .side-items {
          width: 100%;
          max-width: 260px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
          text-align: center;
        }

        .side-items button {
          padding: 4px 0;
          font-size: 16px;
          font-weight: 500;
          background: none;
          border: none;
          color: #374151;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .side-items button:active {
          transform: scale(0.98);
          opacity: 0.8;
        }

        /* Активное состояние */
        body.menu-open .menu-overlay {
          opacity: 1;
          pointer-events: all;
        }

        body.menu-open .side-menu {
          right: 0;
        }
      `}</style>
    </>
  );
}
