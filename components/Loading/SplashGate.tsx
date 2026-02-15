/* path: components/Loading/SplashGate.tsx */
'use client';

import React, { useEffect, useState } from 'react';
import FullScreenLoader from '@/components/Loading/FullScreenLoader';

type Props = {
  children: React.ReactNode;
  bgUrl: string;
  durationMs?: number; // сколько держать splash
  spinnerSize?: number;
};

export default function SplashGate({ children, bgUrl, durationMs = 3000, spinnerSize = 70 }: Props) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), Math.max(0, Math.floor(durationMs)));
    return () => clearTimeout(t);
  }, [durationMs]);

  return (
    <>
      {/* пока splash — НЕ показываем контент */}
      {show ? <FullScreenLoader bgUrl={bgUrl} spinnerSize={spinnerSize} /> : null}
      <div style={{ display: show ? 'none' : 'block' }}>{children}</div>
    </>
  );
}
