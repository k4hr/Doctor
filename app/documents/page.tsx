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

  const version = useMemo(() => '1.0', []);

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

  return (
    <main className="page">
      <TopBarBack />

      <DocumentShell title="Документы" subtitle="Официальные правила и политики сервиса" updatedAt={version} crumbs={[]}>
        <section className="miniinfo">
          {/* Блок 1 — вступление */}
          <div className="miniinfo-block">
            <h2 className="miniinfo-title">Документы сервиса</h2>
            <p className="miniinfo-text">
              Здесь собраны юридические документы сервиса{' '}
              <span className="brand">
                <span className="brand-main">ВРАЧИ</span>
                <span className="brand-dot">.</span>
                <span className="brand-accent">ТУТ</span>
              </span>
              . Их можно открыть из оплаты и профиля. Актуальная версия: <b>{version}</b>.
            </p>
            <p className="miniinfo-text">
              Если нужна помощь по документам или платежам — напишите на{' '}
              <a href="mailto:vrachi.tut@yandex.ru">vrachi.tut@yandex.ru</a>.
            </p>

            <button type="button" className="miniinfo-btn" onClick={() => copy('vrachi.tut@yandex.ru')}>
              Скопировать email поддержки
            </button>
          </div>

          {/* Блок 2 — список документов (как “миниинфо” блок) */}
          <div className="miniinfo-block">
            <h2 className="miniinfo-title">Список документов</h2>

            <div className="docs">
              {DOCS.map((d: DocItem) => (
                <button key={d.href} type="button" className="doc-row" onClick={() => go(d.href)}>
                  <div className="doc-row-top">
                    <div className="doc-row-title">{d.title}</div>
                    <div className="doc-row-go">Открыть →</div>
                  </div>
                  <div className="doc-row-desc">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Блок 3 — реквизиты */}
          <div className="miniinfo-block">
            <h2 className="miniinfo-title">Реквизиты оператора</h2>

            <div className="req">
              <div className="req-line">
                <span className="req-k">ИП</span>
                <span className="req-v">Меньшакова Анастасия Сергеевна</span>
              </div>

              <div className="req-line">
                <span className="req-k">ИНН</span>
                <span className="req-v">290221242314</span>
                <button type="button" className="req-copy" onClick={() => copy('290221242314')}>
                  Копировать
                </button>
              </div>

              <div className="req-line">
                <span className="req-k">ОГРНИП</span>
                <span className="req-v">325290000042402</span>
                <button type="button" className="req-copy" onClick={() => copy('325290000042402')}>
                  Копировать
                </button>
              </div>

              <div className="req-line">
                <span className="req-k">Email</span>
                <span className="req-v">vrachi.tut@yandex.ru</span>
                <button type="button" className="req-copy" onClick={() => copy('vrachi.tut@yandex.ru')}>
                  Копировать
                </button>
              </div>
            </div>

            <p className="miniinfo-text note">
              По вопросам документов и платежей пишите на email оператора. Ответ обычно приходит в рабочее время.
            </p>
          </div>
        </section>
      </DocumentShell>

      <style jsx>{`
        .page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

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
          margin: 6px 0;
          font-size: 14px;
          line-height: 1.5;
          color: #4b5563;
        }

        .miniinfo-text.note {
          margin-top: 10px;
          color: rgba(17, 24, 39, 0.62);
          font-size: 13px;
        }

        a {
          color: rgba(17, 24, 39, 0.85);
          font-weight: 800;
          text-decoration: none;
        }

        .brand {
          font-weight: 800;
        }

        .brand-main,
        .brand-dot {
          color: #111827;
        }

        .brand-accent {
          color: #24c768;
        }

        .miniinfo-btn {
          margin-top: 12px;
          padding: 12px 16px;
          width: 100%;
          border-radius: 999px;
          border: none;
          background: #24c768;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          text-align: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 8px 18px rgba(36, 199, 104, 0.35);
        }

        .miniinfo-btn:active {
          transform: scale(0.98);
          box-shadow: 0 6px 14px rgba(36, 199, 104, 0.4);
        }

        .docs {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 4px;
        }

        .doc-row {
          width: 100%;
          text-align: left;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #ffffff;
          border-radius: 16px;
          padding: 12px 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.04);
        }

        .doc-row:active {
          transform: scale(0.99);
          opacity: 0.96;
        }

        .doc-row-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .doc-row-title {
          font-size: 15px;
          font-weight: 900;
          color: #111827;
          line-height: 1.25;
        }

        .doc-row-go {
          font-size: 13px;
          font-weight: 900;
          color: #24c768;
          white-space: nowrap;
          padding-top: 1px;
        }

        .doc-row-desc {
          margin-top: 6px;
          font-size: 13px;
          line-height: 1.5;
          color: rgba(17, 24, 39, 0.62);
        }

        .req {
          margin-top: 6px;
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

        .req-copy {
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

        .req-copy:active {
          transform: scale(0.99);
          opacity: 0.95;
        }
      `}</style>
    </main>
  );
}
