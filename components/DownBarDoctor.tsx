/* path: components/DownBarDoctor.tsx */
'use client';

import ProBuyCard from './pro/buy';

/**
 * DownBarDoctor — блок в конце страницы (НЕ fixed).
 * Внутри: секция PRO (золотая карточка покупки).
 */
export default function DownBarDoctor() {
  return (
    <>
      <section className="downbarDoctor" aria-label="ВРАЧ.PRO">
        <div className="head">
          <div className="title">ВРАЧ.PRO</div>
          <div className="sub">Золотые возможности для врача</div>
        </div>

        <div className="cardWrap">
          <ProBuyCard />
        </div>
      </section>

      <style jsx>{`
        .downbarDoctor {
          margin-top: 18px;
          margin-bottom: 6px;
          display: flex;
          flex-direction: column;
          gap: 12px;

          /* чтобы совпадало с твоими страницами */
          max-width: 430px;
          margin-left: auto;
          margin-right: auto;
        }

        .head {
          padding: 0 2px;
          display: grid;
          gap: 2px;
        }

        .title {
          font-size: 16px;
          font-weight: 950;
          color: #111827;
          letter-spacing: 0.2px;
        }

        .sub {
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.6);
        }

        /* ProBuyCard уже сам рисует карточку.
           Здесь просто выравнивание/воздух. */
        .cardWrap {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      `}</style>
    </>
  );
}
