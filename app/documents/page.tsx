/* path: app/documents/page.tsx */
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../components/TopBarBack';
import DocumentShell from './_components/DocumentShell';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

const DOCS = [
  {
    href: '/documents/user-agreement',
    title: 'Пользовательское соглашение (Пациент)',
    desc: 'Правила сервиса, публичность вопросов, консультации, распределение денег и основные условия.',
  },
  {
    href: '/documents/doctor-offer',
    title: 'Оферта для врачей (Самозанятые/ИП)',
    desc: 'Правила работы врача, качество ответов, выплаты и ответственность.',
  },
  {
    href: '/documents/privacy',
    title: 'Политика конфиденциальности + согласие на данные о здоровье',
    desc: 'Какие данные собираем (Telegram ID), хранение в РФ до года, передача ЮKassa и облаку.',
  },
  {
    href: '/documents/refunds',
    title: 'Политика возвратов',
    desc: '72 часа, возврат при отсутствии ответов/сообщений врача, благодарности без возврата.',
  },
  {
    href: '/documents/moderation',
    title: 'Правила публикации, модерации и жалоб',
    desc: 'Запрещённый контент, жалобы, приватность консультаций и порядок разборов.',
  },
  {
    href: '/documents/cookies',
    title: 'Политика cookies/технологий',
    desc: 'Технические cookies/хранилище (если веб), без рекламной слежки без согласия.',
  },
];

type DocItem = (typeof DOCS)[number];

export default function DocumentsIndexPage() {
  const router = useRouter();

  const version = useMemo(() => {
    // можно легко поднимать версию документов, чтобы её показывать в UI
    return '1.0';
  }, []);

  const go = (path: string) => {
    haptic('light');
    router.push(path);
  };

  const copy = async (text: string) => {
    haptic('light');
    try {
      await navigator.clipboard.writeText(text);
      try {
        (window as any)?.Telegram?.WebApp?.showToast?.('Скопировано');
      } catch {}
    } catch {
      // fallback
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        try {
          (window as any)?.Telegram?.WebApp?.showToast?.('Скопировано');
        } catch {}
      } catch {}
    }
  };

  const openInNew = (href: string) => {
    // в мини-аппе обычно открывают внутрь, но оставим поддержку открытия
    // (на случай веба/десктопа)
    try {
      window.open(href, '_self');
    } catch {
      router.push(href);
    }
  };

  const renderDocRow = (d: DocItem) => (
    <button key={d.href} type="button" className="doc-btn" onClick={() => go(d.href)}>
      <span className="doc-btn-title">{d.title}</span>
      <span className="doc-btn-sub">{d.desc}</span>
      <span className="doc-btn-go">Открыть →</span>
    </button>
  );

  return (
    <main className="page">
      <TopBarBack />

      <DocumentShell title="Документы" subtitle="Официальные правила и политики сервиса" updatedAt={version} crumbs={[]}>
        <h1 className="title">Документы</h1>

        <p className="lead">
          Здесь лежат юридические документы сервиса{' '}
          <span className="brand">
            <span className="brand-main">ВРАЧИ</span>
            <span className="brand-dot">.</span>
            <span className="brand-accent">ТУТ</span>
          </span>
          . Их можно открыть из оплаты и профиля.
        </p>

        <section className="card">
          <div className="card-head">
            <div className="card-head-title">Список документов</div>
            <div className="card-head-sub">Версия: {version}</div>
          </div>

          <div className="doc-list">{DOCS.map(renderDocRow)}</div>

          <div className="help">
            <div className="help-title">Быстрые действия</div>

            <div className="help-grid">
              <button type="button" className="help-btn" onClick={() => openInNew('/documents/privacy')}>
                <span className="help-btn-title">Конфиденциальность</span>
                <span className="help-btn-sub">Чаще всего спрашивают</span>
              </button>

              <button
                type="button"
                className="help-btn"
                onClick={() => copy('vrachi.tut@yandex.ru')}
                aria-label="Скопировать email"
              >
                <span className="help-btn-title">Скопировать Email</span>
                <span className="help-btn-sub">vrachi.tut@yandex.ru</span>
              </button>
            </div>
          </div>
        </section>

        <section className="card req">
          <div className="req-title">Реквизиты оператора</div>

          <div className="req-lines">
            <div className="req-line">
              <span className="req-k">ИП</span>
              <span className="req-v">Меньшакова Анастасия Сергеевна</span>
            </div>

            <div className="req-line">
              <span className="req-k">ИНН</span>
              <span className="req-v">290221242314</span>
              <button type="button" className="copy" onClick={() => copy('290221242314')}>
                Копировать
              </button>
            </div>

            <div className="req-line">
              <span className="req-k">ОГРНИП</span>
              <span className="req-v">325290000042402</span>
              <button type="button" className="copy" onClick={() => copy('325290000042402')}>
                Копировать
              </button>
            </div>

            <div className="req-line">
              <span className="req-k">Email</span>
              <span className="req-v">vrachi.tut@yandex.ru</span>
              <button type="button" className="copy" onClick={() => copy('vrachi.tut@yandex.ru')}>
                Копировать
              </button>
            </div>
          </div>

          <div className="req-note">
            По вопросам документов и платежей пишите на email оператора. Ответ обычно приходит в рабочее время.
          </div>
        </section>
      </DocumentShell>

      <style jsx>{`
        .page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        .title {
          margin: 6px 0 0;
          font-size: 24px;
          font-weight: 900;
          color: #111827;
        }

        .lead {
          margin: 6px 0 12px;
          font-size: 14px;
          line-height: 1.55;
          color: rgba(17, 24, 39, 0.72);
        }

        .brand {
          font-weight: 900;
        }
        .brand-main,
        .brand-dot {
          color: #111827;
        }
        .brand-accent {
          color: #24c768;
        }

        .card {
          background: #ffffff;
          border-radius: 18px;
          padding: 12px;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
          border: 1px solid rgba(15, 23, 42, 0.04);
          width: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .card-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          padding: 2px 2px 0;
        }

        .card-head-title {
          font-size: 14px;
          font-weight: 900;
          color: #111827;
        }

        .card-head-sub {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
        }

        .doc-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .doc-btn {
          width: 100%;
          text-align: left;
          border: 1px solid rgba(156, 163, 175, 0.45);
          background: #ffffff;
          border-radius: 14px;
          padding: 12px 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .doc-btn:active {
          transform: scale(0.99);
          opacity: 0.95;
        }

        .doc-btn-title {
          font-size: 15px;
          font-weight: 900;
          color: #111827;
          line-height: 1.25;
        }

        .doc-btn-sub {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.45;
          margin-top: 1px;
        }

        .doc-btn-go {
          margin-top: 6px;
          font-size: 13px;
          font-weight: 900;
          color: #24c768;
        }

        .help {
          margin-top: 2px;
          border-top: 1px solid rgba(15, 23, 42, 0.06);
          padding-top: 12px;
        }

        .help-title {
          font-size: 14px;
          font-weight: 900;
          color: #111827;
          margin: 0 0 10px;
        }

        .help-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        @media (min-width: 720px) {
          .help-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .help-btn {
          width: 100%;
          text-align: left;
          border: 1px solid rgba(156, 163, 175, 0.45);
          background: #ffffff;
          border-radius: 14px;
          padding: 12px 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .help-btn:active {
          transform: scale(0.99);
          opacity: 0.95;
        }

        .help-btn-title {
          font-size: 14px;
          font-weight: 900;
          color: #111827;
        }

        .help-btn-sub {
          font-size: 12px;
          color: #6b7280;
        }

        .req {
          margin-top: 12px;
        }

        .req-title {
          font-size: 14px;
          font-weight: 900;
          color: #111827;
          margin: 0;
        }

        .req-lines {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .req-line {
          display: grid;
          grid-template-columns: 72px 1fr auto;
          gap: 10px;
          align-items: center;
        }

        .req-k {
          font-size: 12px;
          font-weight: 900;
          color: #111827;
          opacity: 0.9;
        }

        .req-v {
          font-size: 13px;
          color: rgba(17, 24, 39, 0.78);
          line-height: 1.35;
          word-break: break-word;
        }

        .copy {
          border: none;
          background: rgba(36, 199, 104, 0.12);
          color: #24c768;
          font-size: 12px;
          font-weight: 900;
          padding: 8px 10px;
          border-radius: 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
        }

        .copy:active {
          transform: scale(0.99);
          opacity: 0.95;
        }

        .req-note {
          margin-top: 2px;
          font-size: 12px;
          line-height: 1.45;
          color: #6b7280;
        }
      `}</style>
    </main>
  );
}
