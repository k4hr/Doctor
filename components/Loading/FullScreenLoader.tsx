/* path: components/Loading/FullScreenLoader.tsx */
'use client';

import React, { useMemo, useState } from 'react';
import DotSpinner from '@/components/Loading/DotSpinner';

type Props = {
  bgMobileUrl: string; // 9:16
  bgDesktopUrl?: string; // 16:9

  spinnerSize?: number;

  spinnerXPercent?: number; // 0..100
  spinnerYPercent?: number; // 0..100

  mobileObjectPosition?: string; // "60% 45%"
  desktopObjectPosition?: string; // "50% 45%"

  desktopMinWidthPx?: number; // default 900
};

export default function FullScreenLoader({
  bgMobileUrl,
  bgDesktopUrl,
  spinnerSize = 64,

  spinnerXPercent = 50,
  spinnerYPercent = 72,

  mobileObjectPosition = '60% 45%',
  desktopObjectPosition = '50% 45%',

  desktopMinWidthPx = 900,
}: Props) {
  const [imgOk, setImgOk] = useState(true);

  const safeMobile = useMemo(() => String(bgMobileUrl || '').trim(), [bgMobileUrl]);
  const safeDesktop = useMemo(() => (bgDesktopUrl ? String(bgDesktopUrl).trim() : ''), [bgDesktopUrl]);

  return (
    <div className="wrap" aria-label="Загрузка приложения">
      <picture>
        {safeDesktop ? <source media={`(min-width: ${desktopMinWidthPx}px)`} srcSet={safeDesktop} /> : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="bg"
          src={safeMobile}
          alt=""
          decoding="async"
          fetchPriority="high"
          draggable={false}
          onError={() => setImgOk(false)}
          style={{
            opacity: imgOk ? 1 : 0,
          }}
        />
      </picture>

      <div
        className="spinner"
        style={
          {
            left: `${spinnerXPercent}%`,
            top: `${spinnerYPercent}%`,
            ['--mob-pos' as any]: mobileObjectPosition,
            ['--desk-pos' as any]: desktopObjectPosition,
          } as React.CSSProperties
        }
      >
        <DotSpinner size={spinnerSize} dotSize={9} color="#24c768" speedMs={850} />
      </div>

      <style jsx>{`
        .wrap {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #f5f7fa; /* ✅ не чёрный, чтобы 404 не выглядел как смерть */
          overflow: hidden;
        }

        .bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;

          object-fit: cover;
          object-position: var(--mob-pos);

          user-select: none;
          -webkit-user-drag: none;
        }

        @media (min-width: ${desktopMinWidthPx}px) {
          .bg {
            object-position: var(--desk-pos);
          }
        }

        .spinner {
          position: absolute;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
