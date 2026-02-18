/* path: components/DownBar.tsx */
'use client';

import VrachiOnlineBlock from './DownBarUtil/vrachionline';
import OvrachaxBlock from './DownBarUtil/ovrachax';
import VozmojnostiBlock from './DownBarUtil/vozmojnosti';
import MiniInfoBlock from './DownBarUtil/miniinfo';
import OtziviBlock from './DownBarUtil/otzivi';
import StartDoctorBlock from './DownBarUtil/startdoctor';
import OnlyDown from './DownBarUtil/onlydown';

/**
 * Общий DownBar — блок в конце страницы + футер, который прижимается к низу экрана.
 *
 * ВАЖНО:
 * - Эта компонента должна быть в layout/page так, чтобы она была ПОСЛЕДНЕЙ внутри flex-колонки.
 * - Сама DownBar делает: min-height: 100dvh; display:flex; flex-direction:column;
 *   и контенту даёт flex:1, а футер (OnlyDown) окажется внизу даже если контента мало.
 */
export default function DownBar() {
  return (
    <>
      <section className="downWrap">
        <div className="downContent">
          <VrachiOnlineBlock />
          <OvrachaxBlock />
          <VozmojnostiBlock />
          <StartDoctorBlock />
          <MiniInfoBlock />
          <OtziviBlock />
        </div>

        {/* ✅ всегда внизу */}
        <OnlyDown />
      </section>

      <style jsx>{`
        .downWrap {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        }

        /* ✅ все блоки сверху, футер прижимается вниз */
        .downContent {
          flex: 1;
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
