/* path: components/Loading/FullScreenLoader.tsx */
'use client';

import React from 'react';
import DotSpinner from '@/components/Loading/DotSpinner';

type Props = {
  bgMobileUrl: string; // 9:16
  bgDesktopUrl?: string; // 16:9

  spinnerSize?: number;

  // ✅ позиции крутилки ОСТАВЛЯЕМ КАК У ТЕБЯ
  spinnerXPercent?: number; // 0..100
  spinnerYPercent?: number; // 0..100

  // (опционально) подвинуть кадр фона, чтобы не резало лицо
  mobileObjectPosition?: string; // например "60% 45%"
  desktopObjectPosition?: string; // например "50% 45%"

  // брейкпоинт переключения на десктоп-фон
  desktopMinWidthPx?: number; // по умолчанию 900
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
  return (
    <div className="wrap" aria-label="Загрузка приложения">
      <picture>
        {bgDesktopUrl ? (
          <source media={`(min-width: ${desktopMinWidthPx}px)`} srcSet={bgDesktopUrl} />
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="bg"
          src={bgMobileUrl}
          alt=""
          decoding="async"
          fetchPriority="high"
          draggable={false}
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
          background: #000;
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

        /* ✅ крутилка в заданной точке (оставлено 1в1 по твоему файлу) */
        .spinner {
          position: absolute;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
