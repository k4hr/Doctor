/* path: app/loading.tsx */
'use client';

import { useEffect, useState } from 'react';
import FullScreenLoader from '@/components/Loading/FullScreenLoader';

function pickSplash() {
  if (typeof window === 'undefined') return '/splash/doctor-9x16.jpg';
  return window.innerWidth >= 900 ? '/splash/doctor-16x9.jpg' : '/splash/doctor-9x16.jpg';
}

export default function Loading() {
  const [bgUrl, setBgUrl] = useState<string>(() => pickSplash());

  useEffect(() => {
    const onResize = () => setBgUrl(pickSplash());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return <FullScreenLoader bgUrl={bgUrl} spinnerSize={70} spinnerXPercent={50} spinnerYPercent={72} />;
}
