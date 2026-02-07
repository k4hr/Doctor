/* path: app/hamburger/profile/admin/doctor/[id]/error.tsx */
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('🔥 Route error (/hamburger/profile/admin/doctor/[id])', error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '100dvh',
        padding: 16,
        background: '#F5F7FA',
        color: '#111827',
        display: 'grid',
        alignContent: 'start',
        gap: 10,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Ошибка на странице врача</h1>

      <div style={{ fontSize: 12, opacity: 0.8, whiteSpace: 'pre-wrap' }}>
        {String(error?.message || 'Unknown error')}
        {error?.digest ? `\nDigest: ${error.digest}` : ''}
      </div>

      <button
        type="button"
        onClick={() => reset()}
        style={{
          border: 'none',
          borderRadius: 12,
          padding: '12px 14px',
          background: '#111827',
          color: '#fff',
          fontWeight: 900,
          cursor: 'pointer',
        }}
      >
        Повторить
      </button>

      <div style={{ fontSize: 11, opacity: 0.65 }}>
        Открой DevTools/консоль — там будет stack trace (я специально делаю console.error).
      </div>
    </main>
  );
}
