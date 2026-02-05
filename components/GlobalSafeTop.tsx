// components/GlobalSafeTop.tsx
'use client';

export default function GlobalSafeTop() {
  return (
    <style jsx global>{`
      :root {
        /* Telegram/iOS safe-area сверху.
           Никаких "56px принудительно", иначе будет двойной отступ. */
        --lm-safe-top: env(safe-area-inset-top, 0px);
      }
    `}</style>
  );
}
