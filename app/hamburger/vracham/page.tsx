'use client';

import { useRouter } from 'next/navigation';
import TopBarBack from '../../../components/TopBarBack';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

export default function DoctorInfoPage() {
  const router = useRouter();

  const goToForm = () => {
    haptic('medium');
    router.push('/hamburger/doctorRegistration');
  };

  return (
    <main className="docinfo-page">
      <TopBarBack />

      <section className="docinfo-main">
        <h1 className="docinfo-title">Работа с сервисом для врачей</h1>
        <p className="docinfo-sub">
          ВРАЧИ.ТУТ — медицинский сервис онлайн-консультаций. Мы приглашаем
          практикующих специалистов отвечать на вопросы пользователей и
          зарабатывать на платных консультациях.
        </p>

        {/* ЗОЛОТОЙ АКЦЕНТ */}
        <section className="docinfo-card docinfo-card--gold">
          <p className="docinfo-accent-title">
            Возможность дохода на онлайн-консультациях
          </p>
          <p className="docinfo-text">
            Вы отвечаете на платные и бесплатные вопросы пациентов в удобное
            время. За каждый принятый платный ответ врач получает денежное
            вознаграждение на баланс в сервисе.
          </p>
        </section>

        <section className="docinfo-card">
          <h2 className="docinfo-card-title">Как это работает</h2>
          <ol className="docinfo-ol">
            <li>
              Заполнить анкету врача и отправить её на модерацию в сервисе{' '}
              <span className="brand-black">ВРАЧИ.</span>
              <span className="brand-green">ТУТ</span>.
            </li>
            <li>
              Подтвердить контакты и загрузить документы, подтверждающие
              образование и квалификацию.
            </li>
            <li>
              После одобрения анкеты вы получаете доступ к вопросам пациентов
              по выбранным специальностям.
            </li>
            <li>
              Отвечаете на вопросы, получаете отзывы и денежное
              вознаграждение за принятые платные ответы.
            </li>
          </ol>
          <p className="docinfo-small">
            Все анкеты проходят модерацию. Мы работаем только с практикующими
            врачами с действующими документами.
          </p>
        </section>

        <section className="docinfo-card">
          <h2 className="docinfo-card-title">Вознаграждение</h2>
          <p className="docinfo-text">
            За каждый платный вопрос, на который ваш ответ принят, вы получаете
            фиксированное вознаграждение. Размер выплаты зависит от категории
            вопроса и внутренних правил сервиса.
          </p>
          <p className="docinfo-text">
            Начисления копятся на внутреннем балансе. Вывод средств — по
            указанным реквизитам (счёт ИП, самозанятый, карта и т.д.).
          </p>
        </section>

        <section className="docinfo-card">
          <h2 className="docinfo-card-title">Преимущества для врача</h2>
          <ul className="docinfo-ul">
            <li>Дополнительный источник дохода за счёт онлайн-консультаций.</li>
            <li>Реклама собственных услуг и приёма.</li>
            <li>
              Привлечение новых пациентов через персональный профиль в сервисе.
            </li>
            <li>Гибкий график: можно отвечать в удобное время.</li>
            <li>История переписки и отзывов в одном кабинете.</li>
          </ul>
        </section>

        <button type="button" className="docinfo-cta" onClick={goToForm}>
          Заполнить анкету врача
        </button>

        <p className="docinfo-footnote">
          Нажимая «Заполнить анкету врача», вы подтверждаете, что являетесь
          медицинским специалистом и готовы предоставить документы для
          проверки.
        </p>
      </section>

      <style jsx>{`
        .docinfo-page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        .docinfo-main {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-bottom: 72px;
        }

        .docinfo-title {
          margin: 0;
          font-size: 23px;
          font-weight: 900;
          color: #111827;
        }

        .docinfo-sub {
          margin: 6px 0 0;
          font-size: 13px;
          line-height: 1.5;
          color: #6b7280;
        }

        .brand-black {
          font-weight: 800;
          color: #111827;
        }

        .brand-green {
          font-weight: 800;
          color: #24c768;
        }

        .docinfo-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
          border: 1px solid rgba(15, 23, 42, 0.04);
        }

        /* 🟡 ЗОЛОТОЙ БЛОК */
        .docinfo-card--gold {
          background: linear-gradient(180deg, #fff8e1, #fffdf5);
          border: 1px solid rgba(212, 175, 55, 0.55);
          box-shadow:
            0 0 0 1px rgba(212, 175, 55, 0.15),
            0 10px 28px rgba(212, 175, 55, 0.35);
        }

        .docinfo-card-title {
          margin: 0 0 8px;
          font-size: 17px;
          font-weight: 800;
          color: #111827;
        }

        .docinfo-accent-title {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 800;
          color: #9c7a19;
        }

        .docinfo-text {
          margin: 4px 0;
          font-size: 13px;
          line-height: 1.5;
          color: #374151;
        }

        .docinfo-small {
          margin-top: 8px;
          font-size: 11px;
          line-height: 1.4;
          color: #9ca3af;
        }

        .docinfo-ol {
          margin: 4px 0 4px 18px;
          padding: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #374151;
        }

        .docinfo-ul {
          margin: 4px 0;
          padding-left: 18px;
          font-size: 13px;
          line-height: 1.5;
          color: #374151;
        }

        .docinfo-cta {
          margin-top: 6px;
          width: 100%;
          padding: 14px 16px;
          border-radius: 999px;
          border: none;
          background: #24c768;
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(36, 199, 104, 0.35);
        }

        .docinfo-cta:active {
          transform: scale(0.98);
        }

        .docinfo-footnote {
          margin: 6px 4px 0;
          font-size: 11px;
          color: #9ca3af;
        }
      `}</style>
    </main>
  );
}
