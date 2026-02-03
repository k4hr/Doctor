/* path: components/bage/pro.tsx */
'use client';

import React from 'react';

type Props = {
  /** default: 'md' */
  size?: 'sm' | 'md';
  /** default: 'Имеет статус ВРАЧ.PRO' */
  text?: string;
  /** иконка без текста */
  iconOnly?: boolean;
  /** доп. класс */
  className?: string;
  /** по клику (например, “Купить PRO”) */
  onClick?: () => void;
};

function cn(...a: Array<string | undefined | false | null>) {
  return a.filter(Boolean).join(' ');
}

function CrownIcon({ size }: { size: 'sm' | 'md' }) {
  const s = size === 'sm' ? 16 : 18;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* корона */}
      <path
        d="M4.6 9.2l3.4 3.1 4-5 4 5 3.4-3.1 1.1 9.2H3.5l1.1-9.2Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      {/* основание */}
      <path
        d="M6.2 20h11.6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      {/* камни */}
      <circle cx="12" cy="9.2" r="1" fill="currentColor" opacity="0.9" />
      <circle cx="8" cy="11.2" r="0.9" fill="currentColor" opacity="0.75" />
      <circle cx="16" cy="11.2" r="0.9" fill="currentColor" opacity="0.75" />
    </svg>
  );
}

export default function ProBadge({
  size = 'md',
  text = 'Имеет статус ВРАЧ.PRO',
  iconOnly = false,
  className,
  onClick,
}: Props) {
  const Tag = onClick ? ('button' as const) : ('div' as const);

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn('badge', size === 'sm' ? 'sm' : 'md', onClick ? 'clickable' : '', className)}
      aria-label={iconOnly ? text : undefined}
      title={iconOnly ? text : undefined}
    >
      <span className="icon" aria-hidden="true">
        <CrownIcon size={size} />
      </span>

      {iconOnly ? null : (
        <span className="text">
          <span className="prefix">Имеет статус</span> <span className="brand">ВРАЧ.PRO</span>
        </span>
      )}

      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          user-select: none;
          white-space: nowrap;
          -webkit-tap-highlight-color: transparent;

          /* золото */
          background: linear-gradient(180deg, rgba(245, 158, 11, 0.25), rgba(245, 158, 11, 0.14));
          border: 1px solid rgba(180, 83, 9, 0.28);
          box-shadow:
            0 10px 20px rgba(245, 158, 11, 0.10),
            inset 0 1px 0 rgba(255, 255, 255, 0.55);

          color: #7c2d12; /* orange-900-ish */
        }

        .md {
          padding: 8px 12px;
          font-size: 12.5px;
        }

        .sm {
          padding: 6px 10px;
          font-size: 11.5px;
          gap: 7px;
        }

        .icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(124, 45, 18, 0.14);
          box-shadow: 0 6px 12px rgba(245, 158, 11, 0.12);
          color: #92400e; /* amber-800 */
          flex: 0 0 auto;
        }

        .sm .icon {
          width: 24px;
          height: 24px;
        }

        .text {
          font-weight: 950;
          letter-spacing: -0.01em;
          color: rgba(124, 45, 18, 0.92);
        }

        .prefix {
          font-weight: 900;
          color: rgba(124, 45, 18, 0.75);
        }

        .brand {
          font-weight: 1000;
          color: rgba(124, 45, 18, 0.95);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .clickable {
          cursor: pointer;
        }
        .clickable:active {
          transform: scale(0.99);
          opacity: 0.92;
        }
      `}</style>
    </Tag>
  );
}
