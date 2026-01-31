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
            <div className="sdoc-imgWrap" aria-label="Картинка">
              {/* Положи файл в /public, например: /public/startdoctor.png */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="sdoc-img" src="/startdoctor.png" alt="" />
            </div>

            <div className="sdoc-content">
              <h2 className="sdoc-title">Простой старт для врачей</h2>

              <ul className="sdoc-list">
                <li className="sdoc-li">
                  <span className="dot" />
                  <span>Зарегистрируйтесь и заполните свой профиль, загрузите фото</span>
                </li>
                <li className="sdoc-li">
                  <span className="dot" />
                  <span>Загрузите скан диплома о получении медицинского образования</span>
                </li>
              </ul>

              <p className="sdoc-text">
                Всё готово! Начните отвечать на вопросы пользователей. От вашей активности зависит ваш рейтинг и
                заработок.
                <br />
                <br />
                Специалисты с высоким рейтингом будут показываться пользователям чаще.
              </p>

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
          background: radial-gradient(circle at top left, rgba(236, 253, 245, 1) 0, rgba(209, 250, 229, 0.8) 40%, #ffffff 92%);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
        }

        .sdoc-grid {
          display: grid;
          grid-template-columns: 132px 1fr;
          gap: 14px;
          padding: 14px;
          align-items: center;
        }

        .sdoc-imgWrap {
          width: 132px;
          height: 132px;
          border-radius: 18px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.10);
          flex: 0 0 auto;
        }

        .sdoc-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .sdoc-content {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sdoc-title {
          margin: 0;
          font-size: 20px;
          font-weight: 900;
          color: #111827;
          letter-spacing: -0.01em;
        }

        .sdoc-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sdoc-li {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          font-size: 14px;
          line-height: 1.35;
          color: rgba(55, 65, 81, 0.92);
        }

        .dot {
          margin-top: 6px;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #24c768;
          box-shadow: 0 6px 14px rgba(36, 199, 104, 0.30);
          flex: 0 0 auto;
        }

        .sdoc-text {
          margin: 0;
          font-size: 13px;
          line-height: 1.45;
          color: rgba(17, 24, 39, 0.75);
        }

        .sdoc-btn {
          margin-top: 6px;
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

        @media (max-width: 380px) {
          .sdoc-grid {
            grid-template-columns: 118px 1fr;
          }
          .sdoc-imgWrap {
            width: 118px;
            height: 118px;
          }
        }
      `}</style>
    </>
  );
}
