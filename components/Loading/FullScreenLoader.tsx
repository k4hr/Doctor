/* path: components/Loading/FullScreenLoader.tsx */
'use client';

import React from 'react';
import DotSpinner from '@/components/Loading/DotSpinner';

type Props = {
  bgUrl: string; // фон-картинка на весь экран
  spinnerSize?: number;

  // ✅ позиция крутилки (в процентах экрана)
  // 50 / 72 ≈ как твой красный круг на скрине
  spinnerXPercent?: number; // 0..100
  spinnerYPercent?: number; // 0..100
};

export default function FullScreenLoader({
  bgUrl,
  spinnerSize = 64,
  spinnerXPercent = 50,
  spinnerYPercent = 72,
}: Props) {
  return (
    <div className="wrap" aria-label="Загрузка приложения">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg" src={bgUrl} alt="" />

      <div
        className="spinner"
        style={
          {
            left: `${spinnerXPercent}%`,
            top: `${spinnerYPercent}%`,
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
          object-fit: cover; /* 9:16 фон будет на весь экран */
          display: block;
          user-select: none;
          -webkit-user-drag: none;
        }

        /* ✅ крутилка в заданной точке */
        .spinner {
          position: absolute;
          transform: translate(-50%, -50%); /* центрируем по точке */
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
