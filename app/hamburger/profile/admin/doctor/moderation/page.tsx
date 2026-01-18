/* path: app/hamburger/profile/admin/doctor/moderation/page.tsx */
'use client';

import TopBarBack from '../../../../../../components/TopBarBack';

export default function DoctorModerationPage() {
  return (
    <main style={{ padding: 16 }}>
      <TopBarBack />
      <h1 style={{ marginTop: 8 }}>Анкеты на модерацию</h1>
      <p style={{ opacity: 0.7 }}>
        Тут будет список врачей со статусом PENDING/NEED_FIX и переход на карточку <code>/doctor/[id]</code>.
      </p>
    </main>
  );
}
