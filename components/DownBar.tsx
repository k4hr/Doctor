/* path: components/DownBar.tsx */
'use client';

import VrachiOnlineBlock from './DownBarUtil/vrachionline';

/**
 * Общий DownBar — просто блок в конце страницы.
 * Никаких position: fixed — он прижимается вниз благодаря flex в <main>.
 */
export default function DownBar() {
  return (
    <>
      <section className="downbar">
        <VrachiOnlineBlock />
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
