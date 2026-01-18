/* path: app/hamburger/profile/admin/users/page.tsx */
'use client';

import TopBarBack from '../../../../../components/TopBarBack';

export default function AdminUsersPage() {
  return (
    <main style={{ padding: 16 }}>
      <TopBarBack />
      <h1 style={{ marginTop: 8 }}>Пользователи</h1>
      <p style={{ opacity: 0.7 }}>Список, поиск, роли, блокировки — сюда позже прикрутим API.</p>
    </main>
  );
}
