/* path: app/documents/refunds/page.tsx */
'use client';

import DocumentShell from '../_components/DocumentShell';

export default function RefundsPage() {
  return (
    <DocumentShell
      title="Политика возвратов"
      subtitle="Правила возврата по вопросам, консультациям и благодарностям"
      updatedAt="1.0"
      crumbs={[{ href: '/documents/refunds', label: 'Возвраты' }]}
    >
      <section className="miniinfo">
        <div className="miniinfo-block">
          <h2 className="miniinfo-title">Политика возвратов</h2>

          <p className="miniinfo-text muted">
            Платежи принимает Оператор через ЮKassa. Поддержка:{' '}
            <a href="mailto:vrachi.tut@yandex.ru">vrachi.tut@yandex.ru</a>.
          </p>

          <h3 className="doc-h2">1. Общие правила</h3>
          <ol className="doc-list">
            <li>Возврат делается тем же способом, которым была оплата (обычно на ту же карту/источник).</li>
            <li>Возвраты возможны только при выполнении условий ниже.</li>
            <li>Комиссии платежных систем могут удерживаться по правилам эквайринга.</li>
          </ol>

          <h3 className="doc-h2">2. Платный вопрос (72 часа)</h3>
          <ol className="doc-list">
            <li>
              Если в течение <b>72 часов</b> с момента оплаты по вопросу <b>нет ни одного ответа</b> — возврат <b>100%</b>.
            </li>
            <li>
              Если есть <b>хотя бы один содержательный ответ</b> — возврат не производится, кроме:
              <ul className="doc-ul">
                <li>ошибочного платежа (например, двойное списание);</li>
                <li>технического сбоя, который сделал невозможным использование функционала.</li>
              </ul>
            </li>
          </ol>

          <h3 className="doc-h2">3. Консультация-чат (72 часа)</h3>
          <ol className="doc-list">
            <li>Консультация начинается после принятия врачом и оплаты пациентом.</li>
            <li>
              Если врач <b>не ответил вообще</b> в течение <b>72 часов</b> с момента оплаты — возврат <b>100%</b>.
            </li>
            <li>
              Если врач отправил хотя бы одно <b>содержательное</b> сообщение — возврат не производится, кроме ошибки/сбоя.
            </li>
          </ol>

          <h3 className="doc-h2">4. Благодарность</h3>
          <ol className="doc-list">
            <li>Благодарность — добровольный платеж <b>50–100 000 ₽</b>.</li>
            <li>Возвратов нет, кроме ошибочного платежа или технического сбоя.</li>
          </ol>

          <h3 className="doc-h2">5. Как запросить возврат</h3>
          <p className="miniinfo-text">
            Напишите на <a href="mailto:vrachi.tut@yandex.ru">vrachi.tut@yandex.ru</a> с темой “Возврат” и укажите:
          </p>
          <ul className="doc-ul">
            <li>Telegram ID;</li>
            <li>дату/время платежа и сумму;</li>
            <li>причину (например: “0 ответов за 72 часа” / “врач не ответил в консультации”);</li>
            <li>при необходимости — скриншоты.</li>
          </ul>
          <p className="miniinfo-text">Срок рассмотрения — до <b>10 календарных дней</b>.</p>
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
