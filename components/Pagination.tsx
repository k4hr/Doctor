/* path: components/Pagination.tsx */
'use client';

type Props = {
  page: number; // 1-based
  totalPages: number;
  onChange: (page: number) => void;
};

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (!Number.isFinite(totalPages) || totalPages <= 1) return null;

  const go = (p: number) => {
    const next = Math.max(1, Math.min(totalPages, p));
    if (next === page) return;
    haptic('light');
    onChange(next);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      try {
        window.scrollTo(0, 0);
      } catch {}
    }
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pager" aria-label="Пагинация">
      <button type="button" className="nav" onClick={() => go(page - 1)} disabled={page <= 1}>
        ‹
      </button>

      <div className="nums" role="tablist" aria-label="Страницы">
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={p === page ? 'num active' : 'num'}
            onClick={() => go(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
      </div>

      <button type="button" className="nav" onClick={() => go(page + 1)} disabled={page >= totalPages}>
        ›
      </button>

      <style jsx>{`
        .pager {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nav {
          width: 38px;
          height: 36px;
          border-radius: 12px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          color: #111827;
          font-size: 18px;
          font-weight: 900;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          flex: 0 0 auto;
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.04);
        }

        .nav:active {
          transform: scale(0.98);
          opacity: 0.95;
        }

        .nav:disabled {
          opacity: 0.45;
          cursor: default;
        }

        .nums {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding: 2px 2px;
          flex: 1 1 auto;
        }

        .nums::-webkit-scrollbar {
          display: none;
        }

        .num {
          min-width: 38px;
          height: 36px;
          padding: 0 10px;
          border-radius: 12px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          color: #111827;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          flex: 0 0 auto;
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.04);
        }

        .num:active {
          transform: scale(0.98);
          opacity: 0.95;
        }

        .num.active {
          border-color: rgba(36, 199, 104, 0.55);
          background: rgba(36, 199, 104, 0.12);
          color: #059669;
          box-shadow: 0 10px 18px rgba(36, 199, 104, 0.12);
        }
      `}</style>
    </div>
  );
}
