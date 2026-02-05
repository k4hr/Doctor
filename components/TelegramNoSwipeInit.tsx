/* path: components/TelegramNoSwipeInit.tsx */
'use client';

import { useEffect } from 'react';

export default function TelegramNoSwipeInit() {
  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    if (!tg) return;

    const setVar = (name: string, value: number) => {
      const v = Number.isFinite(value) ? value : 0;
      document.documentElement.style.setProperty(name, `${Math.max(0, Math.round(v))}px`);
    };

    const applyAll = () => {
      // 1) Высота вьюпорта Telegram
      const h = Number(tg.viewportHeight) || window.innerHeight;
      document.documentElement.style.setProperty('--tg-viewport-height', `${h}px`);

      // 2) Safe-top: берём максимально надёжное из Telegram, иначе фолбэк env() из CSS
      // Разные версии Telegram/WebApp SDK могут иметь разные поля
      const topFromSafeArea =
        Number(tg.safeAreaInset?.top) ||
        Number(tg.contentSafeAreaInset?.top) ||
        Number(tg.safeArea?.top) ||
        0;

      // Если Telegram отдаёт 0, НЕ затираем фолбэк env(safe-area-inset-top) — это важно
      if (topFromSafeArea > 0) {
        setVar('--lm-safe-top', topFromSafeArea);
      } else {
        // Убираем кастомную переменную, чтобы работал фолбэк из :root (env)
        document.documentElement.style.removeProperty('--lm-safe-top');
      }
    };

    try { tg.disableVerticalSwipes?.(); } catch {}
    try { tg.expand?.(); } catch {}
    try { tg.ready?.(); } catch {}

    applyAll();

    const onViewportChanged = () => applyAll();

    try { tg.onEvent?.('viewportChanged', onViewportChanged); } catch {}
    window.addEventListener('resize', applyAll);

    return () => {
      try { tg.offEvent?.('viewportChanged', onViewportChanged); } catch {}
      window.removeEventListener('resize', applyAll);
    };
  }, []);

  return null;
}
