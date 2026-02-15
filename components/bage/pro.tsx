/* path: components/bage/pro.tsx */
'use client';

import React from 'react';

type Props = {
  /** default: 'sm' (теперь по умолчанию маленький) */
  size?: 'sm' | 'md';
  /** default: 'Имеет статус ВРАЧ.PRO' */
  text?: string;
  /** иконка без текста (по умолчанию true — как маленький прямоугольничек) */
  iconOnly?: boolean;
  /** доп. класс */
  className?: string;
  /** по клику (если не передан — покажем системное окошечко) */
  onClick?: () => void;
};

function cn(...a: Array<string | undefined | false | null>) {
  return a.filter(Boolean).join(' ');
}

function tg(): any | null {
  try {
    return (window as any)?.Telegram?.WebApp || null;
  } catch {
    return null;
  }
}

function sysPopup(message: string) {
  const msg = String(message || '').trim() || '—';
  try {
    tg()?.showAlert?.(msg);
    return;
  } catch {}
  alert(msg);
}

function CrownIcon({ size }: { size: 'sm' | 'md' }) {
  const s = size === 'sm' ? 16 : 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M4.6 9.2l3.4 3.1 4-5 4 5 3.4-3.1 1.1 9.2H3.5l1.1-9.2Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M6.2 20h11.6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="12" cy="9.2" r="1" fill="currentColor" opacity="0.9" />
      <circle cx="8" cy="11.2" r="0.9" fill="currentColor" opacity="0.75" />
      <circle cx="16" cy="11.2" r="0.9" fill="currentColor" opacity="0.75" />
    </svg>
  );
}

export default function ProBadge({
  size = 'sm',
  text = 'Имеет статус ВРАЧ.PRO',
  iconOnly = true,
  className,
  onClick,
}: Props) {
  const handleClick = () => {
    try {
      tg()?.HapticFeedback?.impactOccurred?.('light');
    } catch {}
    if (onClick) return onClick();
    sysPopup(text);
  };

  const Tag = 'button' as const;

  return (
    <Tag
      type="button"
      onClick={handleClick}
      className={cn('chip', size === 'sm' ? 'sm' : 'md', className)}
      aria-label={text}
      title={text}
    >
      <span className="ic" aria-hidden="true">
        <CrownIcon size={size} />
      </span>

      {iconOnly ? null : (
        <span className="tx">
          <span className="brand">ВРАЧ.PRO</span>
        </span>
      )}

      <style jsx>{`
        .chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;

          border-radius: 16px; /* ✅ прямоугольничек с округлениями */
          border: 1px solid rgba(180, 83, 9, 0.22);

          background: linear-gradient(180deg, rgba(245, 158, 11, 0.16), rgba(245, 158, 11, 0.08));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);

          color: rgba(124, 45, 18, 0.95);

          user-select: none;
          -webkit-tap-highlight-color: transparent;
          cursor: pointer;

          transition: transform 120ms ease, filter 120ms ease, box-shadow 120ms ease;
        }

        .sm {
          height: 34px;
          min-width: 34px;
          padding: 0 10px; /* если без текста — будет компактным квадратом */
          font-size: 12px;
          font-weight: 900;
        }

        .md {
          height: 38px;
          min-width: 38px;
          padding: 0 12px;
          font-size: 13px;
          font-weight: 900;
        }

        .ic {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          color: #92400e;
          flex: 0 0 auto;
        }

        .tx {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          letter-spacing: 0.01em;
        }

        .brand {
          font-weight: 1000;
          text-transform: uppercase;
        }

        .chip:active {
          transform: translateY(1px) scale(0.99);
          filter: brightness(0.98);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55), 0 8px 16px rgba(245, 158, 11, 0.08);
        }

        .chip:focus {
          outline: none;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </Tag>
  );
}
