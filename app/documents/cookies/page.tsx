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
      <div className="doc">
        <p className="muted">
          В Telegram mini-app идентификация идёт по Telegram ID. Контакт: <a href="mailto:vrachi.tut@yandex.ru">vrachi.tut@yandex.ru</a>.
        </p>

        <h2>1. Что используем</h2>
        <ol>
          <li>
            В веб-версии (если используется) Сервис может применять <b>технические cookies</b> и/или локальное хранилище
            для: авторизации/сессии, безопасности, сохранения настроек интерфейса.
          </li>
          <li>
            Мы не используем cookies для навязчивой рекламы без отдельного согласия.
          </li>
        </ol>

        <h2>2. Как отключить</h2>
        <p>
          Пользователь может отключить cookies в настройках браузера. При этом часть функций может работать некорректно.
        </p>
      </div>

      <style jsx>{`
        .doc {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(17, 24, 39, 0.78);
        }
        h2 {
          margin: 16px 0 8px;
          font-size: 16px;
          line-height: 1.25;
          font-weight: 900;
          color: #111827;
        }
        p {
          margin: 8px 0;
        }
        ol {
          margin: 8px 0 8px 18px;
          padding: 0;
        }
        li {
          margin: 6px 0;
        }
        a {
          color: rgba(17, 24, 39, 0.85);
          font-weight: 800;
          text-decoration: none;
        }
        .muted {
          margin: 0 0 10px;
          font-size: 13px;
          color: rgba(17, 24, 39, 0.6);
        }
      `}</style>
    </DocumentShell>
  );
}
