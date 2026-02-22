/* path: app/documents/cookies/page.tsx */
'use client';

import DocumentShell from '../_components/DocumentShell';

export default function CookiesPage() {
  return (
    <DocumentShell
      title="Политика cookies/технологий"
      subtitle="Технические cookies и хранение настроек"
      updatedAt="1.0"
      crumbs={[{ href: '/documents/cookies', label: 'Cookies' }]}
    >
      <section className="miniinfo">
        <div className="miniinfo-block">
          <h2 className="miniinfo-title">Политика cookies/технологий</h2>

          <p className="miniinfo-text muted">
            В Telegram mini-app идентификация идёт по Telegram ID. Контакт:{' '}
            <a href="mailto:vrachi.tut@yandex.ru">vrachi.tut@yandex.ru</a>.
          </p>

          <h3 className="doc-h2">1. Что используем</h3>
          <ol className="doc-list">
            <li>
              В веб-версии (если используется) Сервис может применять <b>технические cookies</b> и/или локальное хранилище
              для: авторизации/сессии, безопасности, сохранения настроек интерфейса.
            </li>
            <li>Мы не используем cookies для навязчивой рекламы без отдельного согласия.</li>
          </ol>

          <h3 className="doc-h2">2. Как отключить</h3>
          <p className="miniinfo-text">
            Пользователь может отключить cookies в настройках браузера. При этом часть функций может работать некорректно.
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

        .doc-list li {
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
