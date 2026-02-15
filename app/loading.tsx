/* path: app/loading.tsx */
'use client';

import FullScreenLoader from '@/components/Loading/FullScreenLoader';

export default function Loading() {
  return <FullScreenLoader bgUrl="/splash/doctor.jpg" spinnerSize={70} />;
}
