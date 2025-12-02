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

      {/* Затемнение + выезжающее меню */}
      <div className="menu-overlay" onClick={closeMenu} />

      <aside className="side-menu">
        <button type="button" className="side-close" onClick={closeMenu}>
          ✕
        </button>

        <nav className="side-items">
          <button type="button">Мой профиль</button>
          <button type="button">Мои консультации</button>
          <button type="button">Стать врачом</button>
          <button type="button">О сервисе</button>
        </nav>
      </aside>

      {/* Глобальные стили меню */}
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

        /* Полупрозрачный фон */
        .menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(2px);
          opacity: 0;
          pointer-events: none;
          transition: 0.25s ease;
          z-index: 9998;
        }

        /* Правое меню */
        .side-menu {
          position: fixed;
          top: 0;
          right: -260px;
          width: 260px;
          height: 100%;
          background: #ffffff;
          box-shadow: -4px 0 22px rgba(0, 0, 0, 0.08);
          padding: 20px;
          transition: right 0.28s ease;
          display: flex;
          flex-direction: column;
          z-index: 9999;
        }

        .side-close {
          align-self: flex-end;
          border: none;
          background: transparent;
          font-size: 20px;
          padding: 0;
          margin-bottom: 14px;
          cursor: pointer;
        }

        .side-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }

        .side-items button {
          padding: 10px 0;
          text-align: left;
          font-size: 15px;
          background: none;
          border: none;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          cursor: pointer;
        }

        .side-items button:last-child {
          border-bottom: none;
        }

        /* Активное состояние: body.menu-open */
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
