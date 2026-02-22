/* path: app/documents/moderation/page.tsx */
'use client';

import DocumentShell from '../_components/DocumentShell';

export default function ModerationPage() {
  return (
    <DocumentShell
      title="Правила публикации, модерации и жалоб"
      subtitle="Публичные вопросы/ответы и порядок рассмотрения обращений"
      updatedAt="1.0"
      crumbs={[{ href: '/documents/moderation', label: 'Модерация' }]}
    >
      <section className="miniinfo">
        <div className="miniinfo-block">
          <h2 className="miniinfo-title">Правила публикации и модерации</h2>

          <p className="miniinfo-text muted">
            Контакт: <a href="mailto:vrachi.tut@yandex.ru">vrachi.tut@yandex.ru</a>.
          </p>

          <h3 className="doc-h2">1. Публичность</h3>
          <ol className="doc-list">
            <li>
              Вопросы и ответы в ленте — <b>публичные</b>.
            </li>
            <li>Если у вопроса есть фото/вложения — они видны только врачам выбранной категории.</li>
            <li>Не публикуйте данные документов, адреса, телефоны, банковские реквизиты.</li>
          </ol>

          <h3 className="doc-h2">2. Запрещённый контент</h3>
          <ul className="doc-ul">
            <li>Персональные данные третьих лиц без согласия.</li>
            <li>Документы (паспорт/полис/СНИЛС), адреса, номера телефонов, реквизиты.</li>
            <li>Оскорбления, угрозы, травля, дискриминация.</li>
            <li>Незаконный контент, экстремизм, наркотики, порнография.</li>
            <li>Спам, реклама, “увод” в сторонние мессенджеры/оплату напрямую.</li>
          </ul>

          <h3 className="doc-h2">3. Модерация</h3>
          <ol className="doc-list">
            <li>Оператор вправе скрывать/удалять материалы, ограничивать функционал и блокировать аккаунты при нарушениях.</li>
            <li>При грубых нарушениях меры могут применяться без предварительного уведомления.</li>
          </ol>

          <h3 className="doc-h2">4. Жалобы</h3>
          <p className="miniinfo-text">Жалобу можно подать на:</p>
          <ul className="doc-ul">
            <li>качество ответа/консультации;</li>
            <li>нарушение правил общения;</li>
            <li>незаконный контент;</li>
            <li>мошеннические действия.</li>
          </ul>

          <h3 className="doc-h2">5. Как подать жалобу</h3>
          <p className="miniinfo-text">
            Пишите на <a href="mailto:vrachi.tut@yandex.ru">vrachi.tut@yandex.ru</a> с темой “Жалоба” и приложите:
          </p>
          <ul className="doc-ul">
            <li>Telegram ID;</li>
            <li>описание ситуации;</li>
            <li>даты/время;</li>
            <li>скриншоты/ссылки (если есть).</li>
          </ul>
          <p className="miniinfo-text">Срок рассмотрения — до <b>10 календарных дней</b>.</p>

          <h3 className="doc-h2">6. Приватные консультации</h3>
          <p className="miniinfo-text">
            Поддержка/модерация <b>не читает приватные консультации регулярно</b>. Разбор жалоб ведется по материалам
            сторон (например, скриншоты) и техданным (время, факт отправки, объем и т.п.).
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

        .doc-list {
          margin: 8px 0 10px 18px;
          padding: 0;
          color: #4b5563;
          font-size: 14px;
          line-height: 1.55;
        }

        .doc-ul {
          margin: 8px 0 10px 18px;
          padding: 0;
          color: #4b5563;
          font-size: 14px;
          line-height: 1.55;
        }

        .doc-list li,
        .doc-ul li {
          margin: 6px 0;
        }

        a {
          color: rgba(17, 24, 39, 0.85);
          font-weight: 800;
          text-decoration: none;
        }
      `}</style>
    </DocumentShell>
  );
}
