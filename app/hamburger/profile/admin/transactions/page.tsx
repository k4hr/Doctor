/* path: app/hamburger/profile/admin/transactions/page.tsx */
'use client';

import TopBarBack from '../../../../../components/TopBarBack';

export default function AdminTransactionsPage() {
  return (
    <main style={{ padding: 16 }}>
      <TopBarBack />
      <h1 style={{ marginTop: 8 }}>Транзакции</h1>
      <p style={{ opacity: 0.7 }}>Платежи/списания/история — сюда позже прикрутим API.</p>
    </main>
  );
}
