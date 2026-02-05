/* path: components/GlobalSafeTop.tsx */
'use client';

export default function GlobalSafeTop() {
  return (
    <style jsx global>{`
      :root {
        /* ✅ ФОЛБЭК. Если TelegramNoSwipeInit поставит --lm-safe-top, он перекроет это значение.
           Если НЕ поставит — будет работать iOS safe-area. */
        --lm-safe-top: env(safe-area-inset-top, 0px);
      }
    `}</style>
  );
}
