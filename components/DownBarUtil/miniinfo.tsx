/* path: components/DownBarUtil/miniinfo.tsx */
'use client';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

export default function MiniInfoBlock() {
  const handleFormClick = () => {
    haptic('light');
    // TODO: переход на реальный путь формы создания вопроса
    console.log('open question form');
  };

  return (
    <>
      <section className="miniinfo">
        {/* Блок 1 — про дистанционный вопрос */}
        <div className="miniinfo-block">
          <h2 className="miniinfo-title">Задать вопрос врачу дистанционно</h2>
          <p className="miniinfo-text">
            На медицинском сервисе онлайн-консультаций{' '}
            <span className="brand">
              <span className="brand-main">ВРАЧИ</span>
              <span className="brand-dot">.</span>
              <span className="brand-accent">ТУТ</span>
            </span>{' '}
            вы можете задать вопрос врачу и получить консультацию, не выходя из
            дома. Всё происходит в удобном формате чата.
          </p>
          <p className="miniinfo-text">
            На портале постоянно работают множество опытных врачей первой и
            высшей категорий, прошедших проверку документов и квалификации.
            Доступны специалисты десятков направлений — от педиатров и
            терапевтов до узких профилей. Можно читать отзывы пациентов и
            задавать вопросы как взрослым, так и детским врачам.
          </p>
        </div>

        {/* Блок 2 — как проходит консультация */}
        <div className="miniinfo-block">
          <h2 className="miniinfo-title">
            Как дистанционно проконсультироваться с доктором
          </h2>
          <p className="miniinfo-text">
            Чтобы получить медицинскую консультацию онлайн, достаточно кратко
            описать жалобы и ситуацию в специальной форме вопроса. После
            публикации ваш вопрос увидят врачи, дежурящие на сервисе, и
            подключатся к обсуждению.
          </p>
          <p className="miniinfo-text">
            Консультации проходят полностью дистанционно и доступны в любое
            время суток. Вы можете задать вопрос, дождаться ответов и вернуться
            к переписке, когда удобно. Сервис работает без выходных.
          </p>

          <button
            type="button"
            className="miniinfo-btn"
            onClick={handleFormClick}
          >
            Открыть форму вопроса
          </button>
        </div>

        {/* Блок 3 — сертификаты врачей */}
        <div className="miniinfo-block">
          <h2 className="miniinfo-title">Сертификаты врачей</h2>
          <p className="miniinfo-text">
            Каждый врач на{' '}
            <span className="brand">
              <span className="brand-main">ВРАЧИ</span>
              <span className="brand-dot">.</span>
              <span className="brand-accent">ТУТ</span>
            </span>{' '}
            проходит проверку наличия медицинского образования и действующих
            сертификатов специалиста. Мы удостоверяемся, что врач имеет право
            вести приём и консультировать пациентов.
          </p>
          <p className="miniinfo-text">
            Документы сверяются с официальными данными, а специалисты регулярно
            подтверждают квалификацию. Дополнительно проводится проверка
            личности врача, чтобы вы были уверены, что консультирует реальный
            практикующий доктор.
          </p>
        </div>
      </section>

      <style jsx>{`
        .miniinfo {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI',
            sans-serif;
        }

        .miniinfo-block {
          background: #ffffff;
          border-radius: 20px;
          padding: 18px 16px 20px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
        }

        .miniinfo-title {
          margin: 0 0 10px;
          font-size: 20px;
          line-height: 1.25;
          font-weight: 900;
          color: #111827;
          position: relative;
        }

        .miniinfo-title::after {
          content: '';
          display: block;
          width: 56px;
          height: 3px;
          border-radius: 999px;
          background: #24c768;
          margin-top: 4px;
        }

        .miniinfo-text {
          margin: 6px 0;
          font-size: 14px;
          line-height: 1.5;
          color: #4b5563;
        }

        .brand {
          font-weight: 800;
        }

        .brand-main,
        .brand-dot {
          color: #111827; /* чёрный */
        }

        .brand-accent {
          color: #24c768; /* зелёный только для ТУТ */
        }

        .miniinfo-btn {
          margin-top: 12px;
          padding: 12px 16px;
          width: 100%;
          border-radius: 999px;
          border: none;
          background: #24c768;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          text-align: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 8px 18px rgba(36, 199, 104, 0.35);
        }

        .miniinfo-btn:active {
          transform: scale(0.98);
          box-shadow: 0 6px 14px rgba(36, 199, 104, 0.4);
        }
      `}</style>
    </>
  );
}
