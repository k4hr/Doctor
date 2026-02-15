/* path: components/Loading/DotSpinner.tsx */
'use client';

import React from 'react';

type Props = {
  size?: number; // px
  dotSize?: number; // px
  color?: string;
  speedMs?: number; // ms
};

export default function DotSpinner({
  size = 56,
  dotSize = 9,
  color = '#24c768',
  speedMs = 850,
}: Props) {
  const dots = 12;
  const r = size / 2;
  const dotR = dotSize / 2;

  return (
    <>
      <div
        className="ds"
        style={
          {
            width: size,
            height: size,
            ['--ds-color' as any]: color,
            ['--ds-speed' as any]: `${speedMs}ms`,
          } as React.CSSProperties
        }
        aria-label="Загрузка"
        role="status"
      >
        {Array.from({ length: dots }).map((_, i) => {
          const angle = (i / dots) * Math.PI * 2;
          const x = r + Math.cos(angle) * (r - dotR) - dotR;
          const y = r + Math.sin(angle) * (r - dotR) - dotR;

          const t = i / (dots - 1);
          const scale = 0.35 + t * 0.75;
          const opacity = 0.12 + t * 0.88;

          return (
            <span
              key={i}
              className="ds-dot"
              style={{
                width: dotSize,
                height: dotSize,
                transform: `translate(${x}px, ${y}px) scale(${scale})`,
                opacity,
              }}
            />
          );
        })}
      </div>

      <style jsx>{`
        .ds {
          position: relative;
          display: inline-block;
          animation: ds-rot var(--ds-speed) linear infinite;
        }

        .ds-dot {
          position: absolute;
          left: 0;
          top: 0;
          border-radius: 999px;
          background: var(--ds-color);
          will-change: transform, opacity;
        }

        @keyframes ds-rot {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
