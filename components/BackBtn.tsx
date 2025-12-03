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
  // Глушим телеграмовский пузырь "Назад"
  useEffect(() => {
    const tg: any = (window as any)?.Telegram?.WebApp;
    try {
      tg?.BackButton?.hide?.();
      tg?.BackButton?.offClick?.();
    } catch {}
  }, []);

  const handleClick = () => {
    if (history.length > 1 || document.referrer) {
      history.back();
    } else {
      location.assign(fallback);
    }
  };

  return (
    <span className="back-text" onClick={handleClick}>
      ← {label}
    </span>
  );
}
