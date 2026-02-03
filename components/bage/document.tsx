/* path: components/bage/document.tsx */
'use client';

import React from 'react';

type Props = {
  /** default: 'md' */
  size?: 'sm' | 'md';
  /** default: 'Документы подтверждены' */
  text?: string;
  /** иконка без текста */
  iconOnly?: boolean;
  /** доп. класс */
  className?: string;
  /** по клику (если нужно) */
  onClick?: () => void;
};

function cn(...a: Array<string | undefined | false | null>) {
  return a.filter(Boolean).join(' ');
}

function DocIcon({ size }: { size: 'sm' | 'md' }) {
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
      {/* лист */}
      <path
        d="M7 3.5h7.2c.4 0 .8.16 1.08.44l2.78 2.78c.28.28.44.68.44 1.08V19.5A2.5 2.5 0 0 1 16.5 22h-9A2.5 2.5 0 0 1 5 19.5v-13A3 3 0 0 1 7 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      />
      {/* уголок */}
      <path
        d="M14 3.8V7a2 2 0 0 0 2 2h3.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
      {/* галочка */}
      <path
        d="M8.2 13.1l2.2 2.2 5-5.2"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DocumentBadge({
  size = 'md',
  text = 'Документы подтверждены',
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
        <DocIcon size={size} />
      </span>

      {iconOnly ? null : <span className="text">{text}</span>}

      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          user-select: none;
          white-space: nowrap;
          -webkit-tap-highlight-color: transparent;

          /* “премиум” зелёный */
          background: linear-gradient(180deg, rgba(34, 197, 94, 0.22), rgba(34, 197, 94, 0.14));
          border: 1px solid rgba(22, 163, 74, 0.28);
          box-shadow:
            0 10px 20px rgba(22, 163, 74, 0.10),
            inset 0 1px 0 rgba(255, 255, 255, 0.55);

          color: #065f46; /* emerald-800 */
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
          border: 1px solid rgba(6, 95, 70, 0.14);
          box-shadow: 0 6px 12px rgba(22, 163, 74, 0.10);
          color: #047857; /* emerald-700 */
          flex: 0 0 auto;
        }

        .sm .icon {
          width: 24px;
          height: 24px;
        }

        .text {
          font-weight: 950;
          letter-spacing: -0.01em;
          color: rgba(6, 95, 70, 0.92);
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
