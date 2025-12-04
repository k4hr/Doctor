/* path: components/DownBar.tsx */
'use client';

import VrachiOnlineBlock from './DownBarUtil/vrachionline';
import OvrachaxBlock from './DownBarUtil/ovrachax';

/**
 * Общий DownBar — просто блок в конце страницы.
 */
export default function DownBar() {
  return (
    <>
      <section className="downbar">
        <VrachiOnlineBlock />
        <OvrachaxBlock />
      </section>

      <style jsx>{`
        .downbar {
          margin-top: 16px;
          margin-bottom: 4px;
        }
      `}</style>
    </>
  );
}
