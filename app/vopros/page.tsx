/* path: app/vopros/page.tsx */
'use client';

import TopBarBack from '../../components/TopBarBack';
import { VRACHI_LIST } from '../lib/vrachi';

export default function VoprosPage() {
  return (
    <main className="ask-page">
      <TopBarBack />

      <section className="ask-card" aria-label="Форма вопроса врачу">
        <header className="ask-header">
          <h1 className="ask-title">Задать вопрос врачу</h1>
          <div className="ask-underline" />
        </header>

        {/* Раздел медицины */}
        <label className="field">
          <span className="field-label">Раздел медицины</span>
          <div className="select-wrap">
            <select defaultValue="">
              <option value="" disabled>
                Выберите раздел медицины
              </option>
              {VRACHI_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <p className="field-hint">
            Если сомневаетесь в выборе категории, выберите{' '}
            <button
              type="button"
              className="link-btn"
              // TODO: автоподстановка "Терапевт"
              onClick={() => null}
            >
              терапевт
            </button>
            .
          </p>
        </label>

        {/* Заголовок */}
        <label className="field">
          <span className="field-label">Заголовок вопроса</span>
          <input
            type="text"
            className="text-input"
            placeholder="Краткий заголовок вопроса"
          />
          <p className="field-hint">
            Например: «Что делать, если морозит и чувствуется слабость?»
          </p>
        </label>

        {/* Тело вопроса */}
        <label className="field">
          <span className="field-label">Ваш вопрос врачу</span>
          <textarea
            className="textarea-input"
            placeholder="Ваш вопрос врачу — постарайтесь описать проблему наиболее детально"
            rows={5}
          />
          <p className="field-hint field-hint--warning">
            Необходимо ввести не менее 50&nbsp;символов.
          </p>
        </label>

        {/* Ключевые слова */}
        <label className="field">
          <span className="field-label">Ключевые слова</span>
          <input
            type="text"
            className="text-input"
            placeholder="Задайте ключевые слова через запятую"
          />
        </label>

        {/* Кнопка отправки */}
        <button
          type="button"
          className="ask-submit"
          onClick={() => null} // TODO: сабмит
        >
          Отправить вопрос
        </button>
      </section>

      <style jsx>{`
        .ask-page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px);
          display: flex;
          flex-direction: column;
          gap: 18px;
          /* НИКАКОГО своего background — берём общий фон приложения */
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI',
            sans-serif;
        }

        /* Просто вертикальный контейнер, без карточки */
        .ask-card {
          margin-top: 4px;
          padding-bottom: 12px;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        .ask-header {
          text-align: center;
          margin-bottom: 16px;
        }

        .ask-title {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #0b0c10;
        }

        .ask-underline {
          margin: 6px auto 0;
          width: 88px;
          height: 3px;
          border-radius: 999px;
          background: #24c768;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 14px;
        }

        .field-label {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        .select-wrap {
          position: relative;
        }

        .select-wrap select {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          padding: 10px 38px 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(15, 23, 42, 0.18);
          background: #f9fafb;
          font-size: 14px;
          color: #111827;
        }

        .select-wrap::after {
          content: '▾';
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: rgba(15, 23, 42, 0.65);
          pointer-events: none;
        }

        .text-input,
        .textarea-input {
          width: 100%;
          border-radius: 10px;
          border: 1px solid rgba(15, 23, 42, 0.18);
          background: #f9fafb;
          font-size: 14px;
          padding: 10px 12px;
          color: #111827;
        }

        .textarea-input {
          resize: vertical;
          min-height: 110px;
        }

        .text-input::placeholder,
        .textarea-input::placeholder {
          color: rgba(107, 114, 128, 0.85);
        }

        .field-hint {
          margin: 0;
          font-size: 11px;
          line-height: 1.4;
          color: rgba(75, 85, 99, 0.9);
        }

        .field-hint--warning {
          color: #b45309;
        }

        .link-btn {
          border: none;
          padding: 0;
          background: none;
          color: #2563eb;
          font-size: 11px;
          font-weight: 600;
          text-decoration: underline;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .ask-submit {
          margin-top: 18px;
          width: 100%;
          padding: 13px 16px;
          border-radius: 999px;
          border: none;
          background: #24c768;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          text-align: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 12px 26px rgba(36, 199, 104, 0.4);
        }

        .ask-submit:active {
          transform: scale(0.98);
          box-shadow: 0 8px 18px rgba(36, 199, 104, 0.45);
        }
      `}</style>
    </main>
  );
}
