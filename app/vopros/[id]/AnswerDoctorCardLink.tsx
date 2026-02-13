/* path: app/vopros/[id]/AnswerDoctorCardLink.tsx */
'use client';

import { useRouter } from 'next/navigation';
import DoctorCard, { type DoctorCardItem } from '../../../components/DoctorCard/DoctorCard';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

type Props = {
  doctor: DoctorCardItem;
  href: string;
};

export default function AnswerDoctorCardLink({ doctor, href }: Props) {
  const router = useRouter();

  return (
    <DoctorCard
      doctor={doctor}
      onClick={() => {
        haptic('light');
        if (!href || href === '#') return;
        router.push(href);
      }}
    />
  );
}
