'use client';

import TopBarBack from '../../../../components/TopBarBack';

export default function DoctorRequirementsPage() {
  return (
    <main className="treb">
      <TopBarBack />

      <h1 className="treb-title">Требования к профилю врача</h1>

      <section className="treb-card">
        <p>
          Профиль врача в сервисе предназначен для пациентов, которые выбирают
          специалиста для онлайн-консультации. Информация должна быть
          достоверной, полной и соответствовать вашей реальной квалификации.
        </p>

        <h2>Обязательные данные</h2>
        <ul>
          <li>Реальные фамилия и имя.</li>
          <li>Актуальная медицинская специальность.</li>
          <li>Действующее медицинское образование.</li>
          <li>Корректный стаж работы.</li>
          <li>Контактный e-mail.</li>
        </ul>

        <h2>Профессиональная информация</h2>
        <ul>
          <li>Подробное описание специализации и направлений работы.</li>
          <li>Опыт практической деятельности.</li>
          <li>Место работы или формат частной практики.</li>
          <li>Дополнительное обучение, курсы, сертификаты.</li>
        </ul>

        <h2>Важно знать</h2>
        <ul>
          <li>
            Все анкеты проходят модерацию перед допуском к консультациям.
          </li>
          <li>
            Сервис работает только с практикующими специалистами.
          </li>
          <li>
            Администрация вправе запросить подтверждающие документы.
          </li>
          <li>
            Недостоверная информация является основанием для отказа или
            блокировки профиля.
          </li>
        </ul>

        <p className="treb-note">
          Подробные требования и правила сервиса могут дополняться и
          обновляться.
        </p>
      </section>

      <style jsx>{`
        .treb {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        .treb-title {
          font-size: 22px;
          font-weight: 900;
          margin: 8px 0 12px;
          color: #111827;
        }

        .treb-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
        }

        h2 {
          margin-top: 14px;
          margin-bottom: 6px;
          font-size: 16px;
          font-weight: 800;
          color: #111827;
        }

        ul {
          padding-left: 18px;
          margin: 6px 0;
        }

        li {
          margin-bottom: 4px;
        }

        .treb-note {
          margin-top: 12px;
          font-size: 12px;
          color: #6b7280;
        }
      `}</style>
    </main>
  );
}
