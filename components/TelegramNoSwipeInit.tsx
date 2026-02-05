/* path: components/TelegramNoSwipeInit.tsx */
'use client';

import { useEffect } from 'react';

export default function TelegramNoSwipeInit() {
  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    if (!tg) return;

    const applyViewportHeight = () => {
      const h = Number(tg.viewportHeight) || window.innerHeight;
      document.documentElement.style.setProperty('--tg-viewport-height', `${h}px`);
    };

    try { tg.disableVerticalSwipes?.(); } catch {}
    try { tg.expand?.(); } catch {}
    try { tg.ready?.(); } catch {}

    applyViewportHeight();

    const onViewportChanged = () => applyViewportHeight();

    try { tg.onEvent?.('viewportChanged', onViewportChanged); } catch {}
    window.addEventListener('resize', applyViewportHeight);

    return () => {
      try { tg.offEvent?.('viewportChanged', onViewportChanged); } catch {}
      window.removeEventListener('resize', applyViewportHeight);
    };
  }, []);

  return null;
}
