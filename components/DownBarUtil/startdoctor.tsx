/* path: components/DownBarUtil/startdoctor.tsx */
'use client';

import { useRouter } from 'next/navigation';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

export default function StartDoctorBlock() {
  const router = useRouter();

  const go = () => {
    haptic('light');
    router.push('/hamburger/vracham');
  };

  return (
    <>
      <section className="sdoc">
        <div className="sdoc-card">
          <div className="sdoc-grid">
            <div className="sdoc-titleWrap">
              <h2 className="sdoc-title">Простой старт для врачей</h2>
            </div>

            <div className="sdoc-imgWrap" aria-label="Картинка">
              {/* Положи файл в /public, например: /public/startdoctor.png */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="sdoc-img" src="/startdoctor.png" alt="" />
            </div>

            <div className="sdoc-content">
              <div className="sdoc-cols">
                <div className="sdoc-steps">
                  <div className="step">
                    <div className="stepN">1</div>
                    <div className="stepT">
                      <b>Зарегистрируйтесь</b> и заполните свой профиль, загрузите фото
                    </div>
                  </div>

                  <div className="step">
                    <div className="stepN">2</div>
                    <div className="stepT">
                      <b>Загрузите</b> скан диплома о получении медицинского образования
                    </div>
                  </div>
                </div>

                <div className="sdoc-text">
                  <p className="p">
                    <b>Всё готово!</b> Начните отвечать на вопросы пользователей. От вашей активности зависит ваш рейтинг
                    и заработок.
                  </p>
                  <p className="p">Специалисты с высоким рейтингом будут показываться пользователям чаще.</p>
                </div>
              </div>

              <button type="button" className="sdoc-btn" onClick={go}>
                Я ВРАЧ
              </button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .sdoc {
          margin-top: 28px;
        }

        .sdoc-card {
          width: 100%;
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: radial-gradient(
            circle at top left,
            rgba(236, 253, 245, 1) 0,
            rgba(209, 250, 229, 0.78) 40%,
            #ffffff 92%
          );
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
        }

        .sdoc-grid {
          display: grid;
          grid-template-columns: 170px 1fr;
          grid-template-areas:
            'title title'
            'img content';
          gap: 14px;
          padding: 14px;
          align-items: stretch;
        }

        .sdoc-titleWrap {
          grid-area: title;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 6px 6px 2px;
        }

        .sdoc-title {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
          color: #111827;
          letter-spacing: -0.01em;
          text-align: center;
        }

        /* ✅ ВАЖНО: делаем контейнер ПОД ПОРТРЕТ (высокий прямоугольник), а не квадрат */
        .sdoc-imgWrap {
          grid-area: img;
          width: 170px;
          aspect-ratio: 3 / 4; /* было квадратом — теперь вытянуто вверх/вниз */
          border-radius: 18px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.1);
          display: grid;
          place-items: center;
        }

        .sdoc-img {
          width: 100%;
          height: 100%;
          object-fit: contain; /* ✅ фото помещается полностью */
          display: block;
          background: #ffffff;
        }

        .sdoc-content {
          grid-area: content;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 2px;
        }

        .sdoc-cols {
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: 18px;
          align-items: start;
        }

        .sdoc-steps {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .step {
          display: grid;
          grid-template-columns: 42px 1fr;
          gap: 12px;
          align-items: start;
        }

        .stepN {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          border: 2px solid rgba(15, 23, 42, 0.45);
          background: rgba(255, 255, 255, 0.75);
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 18px;
          color: rgba(17, 24, 39, 0.92);
          flex: 0 0 auto;
        }

        .stepT {
          font-size: 14px;
          line-height: 1.4;
          color: rgba(17, 24, 39, 0.88);
          text-align: left;
        }

        .sdoc-text {
          font-size: 14px;
          line-height: 1.5;
          color: rgba(17, 24, 39, 0.8);
          text-align: left;
        }

        .p {
          margin: 0 0 12px;
        }

        .p:last-child {
          margin-bottom: 0;
        }

        .sdoc-btn {
          width: 100%;
          border: none;
          border-radius: 16px;
          padding: 14px 14px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;

          background: #24c768;
          color: #ffffff;
          font-size: 15px;
          font-weight: 900;
          text-align: center;

          box-shadow: 0 10px 20px rgba(36, 199, 104, 0.28);
        }

        .sdoc-btn:active {
          transform: scale(0.99);
          opacity: 0.95;
        }

        @media (max-width: 520px) {
          .sdoc-grid {
            grid-template-columns: 150px 1fr;
          }
          .sdoc-imgWrap {
            width: 150px;
            aspect-ratio: 3 / 4;
          }
          .sdoc-cols {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        @media (max-width: 380px) {
          .sdoc-grid {
            grid-template-columns: 132px 1fr;
          }
          .sdoc-imgWrap {
            width: 132px;
            aspect-ratio: 3 / 4;
          }
          .sdoc-title {
            font-size: 20px;
          }
        }
      `}</style>
    </>
  );
}
