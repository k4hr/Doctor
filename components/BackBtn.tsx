/* path: components/BackBtn.tsx */
'use client';

import { useEffect } from 'react';

type BackBtnProps = {
  fallback?: string;
  label?: string;
};

export default function BackBtn({
  fallback = '/home',
  label = 'Назад',
}: BackBtnProps) {
  useEffect(() => {
    const tg: any = (window as any)?.Telegram?.WebApp;

    try {
      const handleClick = () => {
        if (document.referrer || history.length > 1) {
          history.back();
        } else {
          location.assign(fallback);
        }
      };

      tg?.BackButton?.show?.();
      tg?.BackButton?.onClick?.(handleClick);

      return () => {
        tg?.BackButton?.hide?.();
        tg?.BackButton?.offClick?.(handleClick);
      };
    } catch {
      // тихо игнорируем, если нет Telegram WebApp
    }
  }, [fallback]);

  const handleClick = () => {
    if (history.length > 1) {
      history.back();
    } else {
      location.assign(fallback);
    }
  };

  return (
    <button type="button" onClick={handleClick} className="list-btn">
      ← {label}
    </button>
  );
}
