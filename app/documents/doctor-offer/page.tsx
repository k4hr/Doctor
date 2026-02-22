/* path: app/documents/doctor-offer/page.tsx */
'use client';

import DocumentShell from '../_components/DocumentShell';

export default function DoctorOfferPage() {
  return (
    <DocumentShell
      title="Оферта для врачей (Самозанятые/ИП)"
      subtitle="Правила работы врача и выплаты"
      updatedAt="1.0"
      crumbs={[{ href: '/documents/doctor-offer', label: 'Оферта для врачей' }]}
    >
      <section className="miniinfo">
        <div className="miniinfo-block">
          <h2 className="miniinfo-title">Оферта для врачей</h2>

          <p className="miniinfo-text muted">
            Оператор: <b>ИП Меньшакова А.С.</b> (ИНН 290221242314, ОГРНИП 325290000042402). Поддержка:{' '}
            <a href="mailto:vrachi.tut@yandex.ru">vrachi.tut@yandex.ru</a>.
          </p>

          <h3 className="doc-h2">1. Кто может работать врачом</h3>
          <ol className="doc-list">
            <li>Врачом может быть только лицо со статусом <b>самозанятого (НПД)</b> или <b>ИП</b>, прошедшее проверку.</li>
            <li>
              Врач подтверждает, что Оператор <b>не является налоговым агентом</b> врача. Налоги/взносы врач ведет
              самостоятельно.
            </li>
          </ol>

          <h3 className="doc-h2">2. Формат сервиса (важно)</h3>
          <ol className="doc-list">
            <li>Ответы и консультации в Сервисе — <b>информационный формат</b>, не телемедицина и не медпомощь.</li>
            <li>
              Запрещено: ставить диагноз, выписывать рецепты, назначать лечение как обязательное, оформлять
              больничные/меддокументы.
            </li>
            <li>При “красных флагах” врач обязан рекомендовать срочное обращение/скорую помощь.</li>
          </ol>

          <h3 className="doc-h2">3. Качество: “содержательный ответ”</h3>
          <p className="miniinfo-text">
            Чтобы не было “ок” за деньги, в Сервисе действует чек-лист качества. Ответ считается содержательным, если он:
          </p>
          <ul className="doc-ul">
            <li>отвечает по существу вопроса;</li>
            <li>объясняет логику (почему так, какие варианты);</li>
            <li>даёт аккуратные рекомендации в рамках информационного формата;</li>
            <li>не является формальной отпиской/однословным сообщением;</li>
            <li>при необходимости предупреждает о необходимости очного визита/срочности.</li>
          </ul>

          <h3 className="doc-h2">4. Платные вопросы (72 часа)</h3>
          <ol className="doc-list">
            <li>Минимальная сумма платного вопроса: <b>600 ₽</b>. Пациент может оплатить больше.</li>
            <li>Срок ответов: <b>72 часа</b> с момента оплаты.</li>
            <li>Пациент может распределить сумму между <b>до 3 врачей</b> при закрытии вопроса.</li>
            <li>
              Если пациент не закрыл вопрос в срок, распределение по умолчанию: <b>100% первому врачу, давшему содержательный ответ</b>.
            </li>
          </ol>

          <h3 className="doc-h2">5. Консультации-чат</h3>
          <ol className="doc-list">
            <li>Цена консультации задаётся врачом: <b>от 1000 ₽</b>.</li>
            <li>
              Консультация начинается после принятия запроса врачом и оплаты пациентом. Длительность: <b>72 часа</b> либо
              до закрытия пациентом.
            </li>
            <li>
              Если врач <b>не ответил вообще</b> за 72 часа — пациенту делается возврат 100%, а к врачу применяются меры
              (предупреждение/ограничение/блокировка).
            </li>
          </ol>

          <h3 className="doc-h2">6. Благодарности</h3>
          <ol className="doc-list">
            <li>Сумма: <b>50–100 000 ₽</b>.</li>
            <li>Благодарность может быть отправлена без оказания услуги.</li>
            <li>Возвратов нет (кроме ошибочного платежа/техсбоя).</li>
          </ol>

          <h3 className="doc-h2">7. PRO-подписка</h3>
          <ol className="doc-list">
            <li>Стоимость: <b>199 ₽/месяц</b>, без пробных периодов.</li>
            <li>Подписка автопродлевается до отмены врачом.</li>
            <li>Функция благодарностей доступна у врача при активной PRO (если включено в продукте).</li>
          </ol>

          <h3 className="doc-h2">8. Выплаты врачу и паспорт</h3>
          <ol className="doc-list">
            <li>Деньги от пациентов поступают Оператору через ЮKassa, далее выплачиваются врачам.</li>
            <li>Минимальная сумма вывода: <b>10 000 ₽</b>.</li>
            <li>
              Паспорт врача запрашивается <b>только при выводе</b>. Хранение: РФ-облако до <b>12 месяцев</b>.
            </li>
            <li>Оператор вправе приостановить выплаты при подозрении на фрод/жалобах/проверке статуса.</li>
          </ol>

          <h3 className="doc-h2">9. Приватность консультаций</h3>
          <p className="miniinfo-text">
            Оператор не читает приватные консультации регулярно. Разбор жалоб ведётся по материалам сторон (скриншоты) и
            техданным (время, факт отправки, объем и т.п.).
          </p>

          <h3 className="doc-h2">10. Контакты и реквизиты</h3>
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
