/* path: components/Hamburger.tsx */
'use client';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

export default function Hamburger() {
  const openMenu = () => {
    haptic('light');
    try {
      document.body.classList.add('menu-open');
    } catch {}
  };

  const closeMenu = () => {
    try {
      document.body.classList.remove('menu-open');
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

        {/* Контейнер, центрированный по ВЫСОТЕ шторки */}
        <div className="side-inner">
          <nav className="side-items">
            <button type="button">Мой профиль</button>
            <button type="button">Мои консультации</button>
            <button type="button">Стать врачом</button>
            <button type="button">О сервисе</button>
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

        /* X в правом верхнем углу шторки — чёрный и ОЩУТИМО ниже телеграм-меню */
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

        /* Контейнер, центрированный по ВЫСОТЕ шторки */
        .side-inner {
          height: 100%;
          padding: 0 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .side-items {
          width: 100%;
          max-width: 260px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
          text-align: center;
        }

        .side-items button {
          padding: 4px 0;
          font-size: 16px;
          font-weight: 600;
          background: none;
          border: none;
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
          color: #0b0c10;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .side-items button:last-child {
          border-bottom: none;
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
