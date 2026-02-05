// components/GlobalSafeTop.tsx
'use client';

export default function GlobalSafeTop() {
  return (
    <style jsx global>{`
      :root {
        /* В Telegram WebView на iOS чаще всего не нужно добавлять safe-area сверху.
           Мы убираем его полностью, чтобы не было "воздуха" над твоим топбаром. */
        --lm-safe-top: 0px;
      }
    `}</style>
  );
}
