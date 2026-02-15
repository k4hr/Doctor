/* path: app/hamburger/profile/admin/doctor/all/AdminDoctorAllClient.tsx */
'use client';

import { useRouter } from 'next/navigation';
import DoctorCard, { type DoctorCardItem } from '../../../../../../components/DoctorCard/DoctorCard';

type Props = {
  items: DoctorCardItem[];
};

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

export default function AdminDoctorAllClient({ items }: Props) {
  const router = useRouter();

  return (
    <section style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.length === 0 ? (
        <div
          style={{
            padding: 12,
            borderRadius: 14,
            border: '1px solid rgba(10,12,20,0.08)',
            background: 'rgba(255,255,255,0.92)',
            opacity: 0.85,
          }}
        >
          Пока нет одобренных анкет.
        </div>
      ) : (
        items.map((d) => (
          <DoctorCard
            key={d.id}
            doctor={d}
            onClick={() => {
              haptic('light');
              router.push(`/hamburger/profile/admin/doctor/${encodeURIComponent(d.id)}`);
            }}
          />
        ))
      )}
    </section>
  );
}
