/* path: components/Loading/SplashGate.tsx */
'use client';

import React, { useEffect, useState } from 'react';
import FullScreenLoader from '@/components/Loading/FullScreenLoader';

type Props = {
  children: React.ReactNode;

  bgMobileUrl: string; // 9:16
  bgDesktopUrl?: string; // 16:9

  durationMs?: number;
  spinnerSize?: number;

  spinnerXPercent?: number;
  spinnerYPercent?: number;

  mobileObjectPosition?: string;
  desktopObjectPosition?: string;

  desktopMinWidthPx?: number;
};

export default function SplashGate({
  children,

  bgMobileUrl,
  bgDesktopUrl,

  durationMs = 3000,
  spinnerSize = 70,

  spinnerXPercent = 50,
  spinnerYPercent = 72,

  mobileObjectPosition = '60% 45%',
  desktopObjectPosition = '50% 45%',

  desktopMinWidthPx = 900,
}: Props) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), Math.max(0, Math.floor(durationMs)));
    return () => clearTimeout(t);
  }, [durationMs]);

  return (
    <>
      {show ? (
        <FullScreenLoader
          bgMobileUrl={bgMobileUrl}
          bgDesktopUrl={bgDesktopUrl}
          spinnerSize={spinnerSize}
          spinnerXPercent={spinnerXPercent}
          spinnerYPercent={spinnerYPercent}
          mobileObjectPosition={mobileObjectPosition}
          desktopObjectPosition={desktopObjectPosition}
          desktopMinWidthPx={desktopMinWidthPx}
        />
      ) : null}

      <div style={{ display: show ? 'none' : 'block' }}>{children}</div>
    </>
  );
}
