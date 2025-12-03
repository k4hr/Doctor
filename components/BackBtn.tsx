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
  // На всякий случай отключаем системную кнопку Telegram BackButton
  useEffect(() => {
    const tg: any = (window as any)?.Telegram?.WebApp;
    try {
      tg?.BackButton?.hide?.();
      tg?.BackButton?.offClick?.(); // если где-то навешивали
    } catch {
      // тихо игнорируем
    }
  }, []);

  const handleClick = () => {
    if (history.length > 1 || document.referrer) {
      history.back();
    } else {
      location.assign(fallback);
    }
  };

  // Внешне — просто текст, кликабельный
  return (
    <span className="back-text" onClick={handleClick}>
      ← {label}
    </span>
  );
}
