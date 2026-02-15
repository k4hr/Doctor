/* path: components/bage/document.tsx */
'use client';

import React from 'react';

type Props = {
  /** default: 'sm' (теперь по умолчанию маленький) */
  size?: 'sm' | 'md';
  /** default: 'Документы подтверждены' */
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

function DocIcon({ size }: { size: 'sm' | 'md' }) {
  const s = size === 'sm' ? 16 : 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M7 3.5h7.2c.4 0 .8.16 1.08.44l2.78 2.78c.28.28.44.68.44 1.08V19.5A2.5 2.5 0 0 1 16.5 22h-9A2.5 2.5 0 0 1 5 19.5v-13A3 3 0 0 1 7 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      />
      <path
        d="M14 3.8V7a2 2 0 0 0 2 2h3.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
      <path d="M8.2 13.1l2.2 2.2 5-5.2" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DocumentBadge({
  size = 'sm',
  text = 'Документы подтверждены',
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
        <DocIcon size={size} />
      </span>

      {iconOnly ? null : <span className="tx">{text}</span>}

      <style jsx>{`
        .chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;

          border-radius: 16px; /* ✅ прямоугольничек с округлениями */
          border: 1px solid rgba(22, 163, 74, 0.22);

          background: linear-gradient(180deg, rgba(34, 197, 94, 0.16), rgba(34, 197, 94, 0.08));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);

          color: rgba(6, 95, 70, 0.95);

          user-select: none;
          -webkit-tap-highlight-color: transparent;
          cursor: pointer;

          transition: transform 120ms ease, filter 120ms ease, box-shadow 120ms ease;
        }

        .sm {
          height: 34px;
          min-width: 34px;
          padding: 0 10px;
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
          color: #047857;
          flex: 0 0 auto;
        }

        .tx {
          font-weight: 950;
          color: rgba(6, 95, 70, 0.92);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
        }

        .chip:active {
          transform: translateY(1px) scale(0.99);
          filter: brightness(0.98);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55), 0 8px 16px rgba(22, 163, 74, 0.08);
        }

        .chip:focus {
          outline: none;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </Tag>
  );
}
