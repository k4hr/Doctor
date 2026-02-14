/* path: app/consultations/page.tsx */
import React, { Suspense } from 'react';
import ConsultationsClient from './ConsultationsClient';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 16, fontWeight: 800 }}>Загрузка…</div>}>
      <ConsultationsClient />
    </Suspense>
  );
}
