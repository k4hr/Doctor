/* path: app/hamburger/profile/admin/doctor/all/page.tsx */
'use client';

import TopBarBack from '../../../../../../components/TopBarBack';

export default function DoctorAllPage() {
  return (
    <main style={{ padding: 16 }}>
      <TopBarBack />
      <h1 style={{ marginTop: 8 }}>Все врачи</h1>
      <p style={{ opacity: 0.7 }}>
        Тут будет таблица/список всех врачей + поиск/фильтры + быстрые действия (suspend/approve).
      </p>
    </main>
  );
}
