/* path: app/hamburger/doctorRegistration/page.tsx */
'use client';

import { FormEvent } from 'react';
import TopBarBack from '../../../components/TopBarBack';
import { VRACHI_LIST } from '../../lib/vrachi';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

export default function DoctorRegistrationPage() {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    haptic('medium');

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    console.log('doctor registration form:', data);

    try {
      (window as any)?.Telegram?.WebApp?.showAlert?.(
        'Анкета врача сохранена. В ближайшее время мы свяжемся с вами в Telegram.'
      );
    } catch {
      alert('Анкета врача сохранена.');
    }
  };

  return (
    <main className="docreg">
      <TopBarBack />

      <h1 className="docreg-title">Анкета врача</h1>
      <p className="docreg-sub">
        Заполните основные данные. Эти сведения помогут пациентам найти вас в
        сервисе <span className="brand">ВРАЧИ.ТУТ</span>.
      </p>

      <form className="docreg-form" onSubmit={handleSubmit}>
        {/* БЛОК 1 — Личные данные */}
        <section className="docreg-card">
          <h2 className="docreg-card-title">Личные данные</h2>

          <label className="docreg-field">
            <span className="docreg-label">
              Фамилия<span className="req">*</span>
            </span>
            <input
              name="lastName"
              type="text"
              required
              placeholder="Иванов"
              className="docreg-input"
            />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">
              Имя<span className="req">*</span>
            </span>
            <input
              name="firstName"
              type="text"
              required
              placeholder="Иван"
              className="docreg-input"
            />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Отчество</span>
            <input
              name="middleName"
              type="text"
              placeholder="Отчество (по желанию)"
              className="docreg-input"
            />
          </label>

          <div className="docreg-field">
            <span className="docreg-label">
              Пол<span className="req">*</span>
            </span>
            <div className="docreg-radio-row">
              <label className="docreg-radio">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  required
                  defaultChecked
                />
                <span>Мужской</span>
              </label>
              <label className="docreg-radio">
                <input type="radio" name="gender" value="female" />
                <span>Женский</span>
              </label>
            </div>
          </div>

          <div className="docreg-field">
            <span className="docreg-label">Дата рождения</span>
            <div className="docreg-dob-row">
              <input
                name="birthDay"
                type="number"
                inputMode="numeric"
                placeholder="День"
                className="docreg-input"
              />
              <input
                name="birthMonth"
                type="number"
                inputMode="numeric"
                placeholder="Месяц"
                className="docreg-input"
              />
              <input
                name="birthYear"
                type="number"
                inputMode="numeric"
                placeholder="Год"
                className="docreg-input"
              />
            </div>
          </div>

          <label className="docreg-field">
            <span className="docreg-label">Город</span>
            <input
              name="city"
              type="text"
              placeholder="Город работы/приёма"
              className="docreg-input"
            />
          </label>
        </section>

        {/* БЛОК 2 — Профессиональные навыки */}
        <section className="docreg-card">
          <h2 className="docreg-card-title">Профессиональные навыки</h2>

          <div className="docreg-field">
            <span className="docreg-label">
              Специализации<span className="req">*</span>
            </span>

            <select
              name="speciality1"
              required
              className="docreg-input docreg-select"
              defaultValue=""
            >
              <option value="" disabled>
                Основная специализация
              </option>
              {VRACHI_LIST.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>

            <select
              name="speciality2"
              className="docreg-input docreg-select docreg-select-second"
              defaultValue=""
            >
              <option value="" disabled>
                Дополнительная специализация (по желанию)
              </option>
              {VRACHI_LIST.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>

            <select
              name="speciality3"
              className="docreg-input docreg-select docreg-select-third"
              defaultValue=""
            >
              <option value="" disabled>
                Ещё одна специализация (по желанию)
              </option>
              {VRACHI_LIST.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>

            <span className="docreg-hint">
              Выберите до трёх специальностей, по которым у вас есть профильное
              образование и по которым вы сможете консультировать и подтвердить
              квалификацию документами.
            </span>
          </div>

          <label className="docreg-field">
            <span className="docreg-label">
              Образование<span className="req">*</span>
            </span>
            <textarea
              name="education"
              required
              placeholder="Укажите ВУЗ, годы обучения, факультет, квалификацию."
              className="docreg-textarea"
              rows={3}
            />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Научная степень</span>
            <select
              name="degree"
              className="docreg-input docreg-select"
              defaultValue="none"
            >
              <option value="none">Нет</option>
              <option value="specialist">Специалист</option>
              <option value="candidate">Кандидат наук</option>
              <option value="doctor">Доктор наук</option>
            </select>
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Место работы</span>
            <input
              name="workplace"
              type="text"
              placeholder="Клиника, медицинский центр"
              className="docreg-input"
            />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Должность</span>
            <input
              name="position"
              type="text"
              placeholder="Занимаемая должность"
              className="docreg-input"
            />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">
              Стаж работы, лет<span className="req">*</span>
            </span>
            <input
              name="experienceYears"
              type="number"
              required
              min={0}
              max={70}
              inputMode="numeric"
              placeholder="Общий стаж"
              className="docreg-input"
            />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Награды</span>
            <textarea
              name="awards"
              placeholder="Какие награды и благодарности вы получали."
              className="docreg-textarea"
              rows={2}
            />
          </label>
        </section>

        {/* БЛОК 3 — Контактные данные */}
        <section className="docreg-card">
          <h2 className="docreg-card-title">Контактные данные</h2>

          <label className="docreg-field">
            <span className="docreg-label">
              E-mail<span className="req">*</span>
            </span>
            <input
              name="email"
              type="email"
              required
              placeholder="doctor@example.com"
              className="docreg-input"
            />
          </label>
        </section>

        {/* БЛОК 4 — Дополнительно */}
        <section className="docreg-card">
          <h2 className="docreg-card-title">Дополнительно</h2>

          <label className="docreg-field">
            <span className="docreg-label">
              О себе<span className="req">*</span>
            </span>
            <textarea
              name="about"
              required
              placeholder="Кратко расскажите о себе, стиле работы, подходе к пациентам."
              className="docreg-textarea"
              rows={3}
            />
            <span className="docreg-hint">
              Это поле будет отображаться в вашем профиле.
            </span>
          </label>

          <label className="docreg-field">
            <span className="docreg-label">
              Специализация подробно<span className="req">*</span>
            </span>
            <textarea
              name="specialityDetails"
              required
              placeholder="С какими запросами чаще всего работаете, какие методы используете."
              className="docreg-textarea"
              rows={3}
            />
            <span className="docreg-hint">
              Это поле будет отображаться в вашем профиле.
            </span>
          </label>

          <label className="docreg-field">
            <span className="docreg-label">
              Опыт работы<span className="req">*</span>
            </span>
            <textarea
              name="experienceDetails"
              required
              placeholder="Опишите более подробно свой опыт работы."
              className="docreg-textarea"
              rows={3}
            />
            <span className="docreg-hint">
              Это поле будет отображаться в вашем профиле.
            </span>
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Повышение квалификации</span>
            <textarea
              name="courses"
              placeholder="Курсы, стажировки, доп. образование."
              className="docreg-textarea"
              rows={2}
            />
            <span className="docreg-hint">
              Это поле будет отображаться в вашем профиле.
            </span>
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Достижения и награды</span>
            <textarea
              name="achievements"
              placeholder="Расскажите о профессиональных достижениях и наградах."
              className="docreg-textarea"
              rows={2}
            />
            <span className="docreg-hint">
              Это поле будет отображаться в вашем профиле.
            </span>
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Научные труды</span>
            <textarea
              name="publications"
              placeholder="Публикации, участие в конференциях, научная деятельность."
              className="docreg-textarea"
              rows={2}
            />
            <span className="docreg-hint">
              Это поле будет отображаться в вашем профиле.
            </span>
          </label>
        </section>

        <button type="submit" className="docreg-submit">
          Сохранить анкету
        </button>

        <p className="docreg-footnote">
          Нажимая «Сохранить анкету», вы подтверждаете корректность указанных
          данных.
        </p>
      </form>

      <style jsx>{`
        .docreg {
          min-height: 100dvh;
          padding: 16px 16px
            calc(env(safe-area-inset-bottom, 0px) + 24px);
          /* без flex, чтобы TopBarBack работал как на главной */
          overflow-x: hidden; /* убираем горизонтальный скролл */
        }

        .docreg-title {
          margin: 4px 0 0;
          font-size: 24px;
          font-weight: 900;
          color: #111827;
        }

        .docreg-sub {
          margin: 4px 0 4px;
          font-size: 13px;
          line-height: 1.5;
          color: #6b7280;
        }

        .brand {
          font-weight: 800;
          color: #24c768;
        }

        .docreg-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 4px;
          padding-bottom: 72px;
        }

        .docreg-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 16px 14px 14px;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
          border: 1px solid rgba(15, 23, 42, 0.04);
        }

        .docreg-card-title {
          margin: 0 0 10px;
          font-size: 17px;
          font-weight: 800;
          color: #111827;
        }

        .docreg-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 10px;
        }

        .docreg-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .req {
          color: #ef4444;
          margin-left: 2px;
        }

        .docreg-input,
        .docreg-textarea,
        .docreg-select {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(156, 163, 175, 0.7);
          padding: 9px 11px;
          font-size: 14px;
          outline: none;
          background: #ffffff;
          box-sizing: border-box; /* чтобы поля не вылезали за контейнер */
        }

        .docreg-input:focus,
        .docreg-textarea:focus,
        .docreg-select:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.4);
        }

        .docreg-textarea {
          resize: vertical;
          min-height: 72px;
        }

        .docreg-select {
          padding-right: 28px;
        }

        .docreg-select-second,
        .docreg-select-third {
          margin-top: 6px;
        }

        .docreg-hint {
          font-size: 11px;
          color: #9ca3af;
        }

        .docreg-radio-row {
          display: flex;
          gap: 16px;
          margin-top: 2px;
        }

        .docreg-radio {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #4b5563;
        }

        .docreg-radio input {
          accent-color: #22c55e;
        }

        .docreg-dob-row {
          display: flex;
          gap: 8px;
        }

        .docreg-dob-row .docreg-input {
          flex: 1;
        }

        .docreg-submit {
          margin-top: 4px;
          width: 100%;
          padding: 14px 16px;
          border-radius: 999px;
          border: none;
          background: #24c768;
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          text-align: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 10px 22px rgba(36, 199, 104, 0.35);
        }

        .docreg-submit:active {
          transform: scale(0.98);
          box-shadow: 0 6px 16px rgba(36, 199, 104, 0.45);
        }

        .docreg-footnote {
          margin: 6px 4px 0;
          font-size: 11px;
          color: #9ca3af;
          text-align: left;
        }
      `}</style>
    </main>
  );
}
