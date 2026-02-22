/* path: app/documents/privacy/page.tsx */
'use client';

import DocumentShell from '../_components/DocumentShell';

export default function PrivacyPage() {
  return (
    <DocumentShell
      title="Политика конфиденциальности"
      subtitle="Персональные данные + согласие на сведения о здоровье"
      updatedAt="1.0"
      crumbs={[{ href: '/documents/privacy', label: 'Конфиденциальность' }]}
    >
      <section className="miniinfo">
        <div className="miniinfo-block">
          <h2 className="miniinfo-title">Политика конфиденциальности</h2>

          <p className="miniinfo-text muted">
            Оператор персональных данных: <b>ИП Меньшакова А.С.</b> (ИНН 290221242314, ОГРНИП 325290000042402). Контакт:{' '}
            <a href="mailto:vrachi.tut@yandex.ru">vrachi.tut@yandex.ru</a>.
          </p>

          <h3 className="doc-h2">1. Какие данные мы обрабатываем</h3>
          <h4 className="doc-h3">1.1. Данные пациентов</h4>
          <ul className="doc-ul">
            <li>
              <b>Telegram ID</b> (единственный обязательный идентификатор).
            </li>
            <li>Тексты вопросов, ответов и сообщений в консультациях.</li>
            <li>Вложения (в т.ч. фото), если пользователь их загружает.</li>
            <li>
              Техданные: дата/время действий, устройство/браузер (если применимо), IP (если фиксируется), идентификаторы
              сессии.
            </li>
          </ul>

          <h4 className="doc-h3">1.2. Данные врачей</h4>
          <ul className="doc-ul">
            <li>ФИО, специализация, сведения о квалификации и документы (по запросу).</li>
            <li>
              <b>Паспорт и реквизиты</b> — только при выводе средств.
            </li>
          </ul>

          <h3 className="doc-h2">2. Сведения о здоровье</h3>
          <p className="miniinfo-text">
            Вопросы/сообщения и вложения могут содержать сведения о здоровье — это специальная категория данных. Мы
            обрабатываем такие сведения только потому, что пользователь добровольно сообщает их для работы сервиса.
          </p>

          <h3 className="doc-h2">3. Цели обработки</h3>
          <ul className="doc-ul">
            <li>Предоставление функционала сервиса (вопросы, ответы, консультации).</li>
            <li>Платежи, возвраты и выплаты врачам.</li>
            <li>Безопасность, антифрод, рассмотрение обращений и споров.</li>
            <li>Исполнение требований закона (учёт, отчётность, 54-ФЗ и т.п.).</li>
          </ul>

          <h3 className="doc-h2">4. Основания обработки</h3>
          <ul className="doc-ul">
            <li>Исполнение договоров (пользовательское соглашение/оферты).</li>
            <li>Согласие субъекта данных (в т.ч. явное согласие на сведения о здоровье).</li>
            <li>Законные обязанности Оператора.</li>
          </ul>

          <h3 className="doc-h2">5. Явное согласие на сведения о здоровье</h3>
          <p className="callout">
            При оплате вопроса/консультации и/или загрузке вложений пользователь дает явное согласие на обработку сведений
            о здоровье, которые он добровольно сообщает.
          </p>
          <p className="miniinfo-text">
            <b>Текст согласия для чекбокса/экрана:</b>
          </p>
          <p className="quote">
            “Я даю явное согласие ИП Меньшаковой А.С. на обработку данных о здоровье, которые я добровольно указываю в
            вопросах/сообщениях/вложениях, для предоставления функционала сервиса, рассмотрения обращений и обеспечения
            безопасности.”
          </p>

          <h3 className="doc-h2">6. Передача третьим лицам</h3>
          <p className="miniinfo-text">Мы передаем данные только в необходимом объеме:</p>
          <ul className="doc-ul">
            <li>
              <b>ЮKassa</b> — прием платежей и возвраты.
            </li>
            <li>Провайдеры облака/хостинга в РФ — хранение данных.</li>
            <li>Уполномоченные органы — по законному запросу.</li>
          </ul>

          <h3 className="doc-h2">7. Где и сколько храним</h3>
          <ul className="doc-ul">
            <li>
              Хранение: инфраструктура/облачный сервис <b>на территории РФ</b>.
            </li>
            <li>
              Срок хранения контента (вопросы/ответы/сообщения/вложения): <b>до 12 месяцев</b>.
            </li>
            <li>
              Паспорт врача при выводе: <b>до 12 месяцев</b> (или дольше, если требуется законом/спором).
            </li>
            <li>Финансовые документы: в сроки, требуемые законом.</li>
          </ul>

          <h3 className="doc-h2">8. Доступ поддержки к переписке</h3>
          <p className="miniinfo-text">
            Поддержка/модерация <b>не читает приватные консультации регулярно</b>. Жалобы рассматриваются по материалам
            сторон и техданным.
          </p>

          <h3 className="doc-h2">9. Права пользователя</h3>
          <p className="miniinfo-text">
            Пользователь может запросить доступ/уточнение/удаление данных или отозвать согласие, если это не противоречит
            исполнению договора и требованиям закона. Запросы:{' '}
            <a href="mailto:vrachi.tut@yandex.ru">vrachi.tut@yandex.ru</a>.
          </p>

          <h3 className="doc-h2">10. Реквизиты</h3>
          <p className="miniinfo-text">
            <b>ИП Меньшакова Анастасия Сергеевна</b>
            <br />
            ИНН: 290221242314
            <br />
            ОГРНИП: 325290000042402
            <br />
            Email: <a href="mailto:vrachi.tut@yandex.ru">vrachi.tut@yandex.ru</a>
          </p>
        </div>
      </section>

      <style jsx>{`
        .miniinfo {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif;
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
          margin: 8px 0;
          font-size: 14px;
          line-height: 1.55;
          color: #4b5563;
        }

        .muted {
          color: rgba(17, 24, 39, 0.6);
          font-size: 13px;
        }

        .doc-h2 {
          margin: 16px 0 8px;
          font-size: 16px;
          line-height: 1.25;
          font-weight: 900;
          color: #111827;
        }

        .doc-h2::after {
          content: '';
          display: block;
          width: 44px;
          height: 3px;
          border-radius: 999px;
          background: rgba(36, 199, 104, 0.65);
          margin-top: 6px;
        }

        .doc-h3 {
          margin: 12px 0 6px;
          font-size: 14px;
          font-weight: 900;
          color: #111827;
        }

        .doc-ul {
          margin: 8px 0 10px 18px;
          padding: 0;
          color: #4b5563;
          font-size: 14px;
          line-height: 1.55;
        }

        .doc-ul li {
          margin: 6px 0;
        }

        a {
          color: rgba(17, 24, 39, 0.85);
          font-weight: 800;
          text-decoration: none;
        }

        .callout {
          margin: 10px 0;
          background: rgba(36, 199, 104, 0.12);
          border: 1px solid rgba(36, 199, 104, 0.22);
          border-radius: 14px;
          padding: 10px 12px;
          color: rgba(17, 24, 39, 0.78);
          font-size: 14px;
          line-height: 1.5;
        }

        .quote {
          border-left: 3px solid rgba(36, 199, 104, 0.8);
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.03);
          color: rgba(17, 24, 39, 0.78);
          font-size: 14px;
          line-height: 1.55;
        }
      `}</style>
    </DocumentShell>
  );
}
