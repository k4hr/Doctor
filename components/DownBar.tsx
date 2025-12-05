/* path: components/DownBar.tsx */
'use client';

import VrachiOnlineBlock from './DownBarUtil/vrachionline';
import OvrachaxBlock from './DownBarUtil/ovrachax';
import VozmojnostiBlock from './DownBarUtil/vozmojnosti';
import MiniInfoBlock from './DownBarUtil/miniinfo';

/**
 * Общий DownBar — просто блок в конце страницы.
 */
export default function DownBar() {
  return (
    <>
      <section className="downbar">
        <VrachiOnlineBlock />
        <OvrachaxBlock />
        <VozmojnostiBlock />
        <MiniInfoBlock />
      </section>

      <style jsx>{`
        .downbar {
          margin-top: 16px;
          margin-bottom: 4px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
      `}</style>
    </>
  );
}
