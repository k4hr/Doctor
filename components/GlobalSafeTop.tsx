// components/GlobalSafeTop.tsx
'use client';

export default function GlobalSafeTop() {
  return (
    <style jsx global>{`
      :root {
        --lm-header-offset: 56px;
        --lm-safe-top: max(env(safe-area-inset-top), var(--lm-header-offset));
      }

      body::before {
        content: '';
        display: block;
        height: var(--lm-safe-top);
        pointer-events: none; /* ✅ важно */
      }

      @media (min-width: 1024px) {
        :root { --lm-header-offset: 40px; }
      }
    `}</style>
  );
}
