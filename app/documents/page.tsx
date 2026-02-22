/* path: app/documents/page.tsx */
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../components/TopBarBack';

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

  return (
    <main className="page">
      <TopBarBack />

      <section className="miniinfo">
        {/* Блок 1 — список документов */}
        <div className="miniinfo-block">
          <h2 className="miniinfo-title">Список документов</h2>

          <div className="docs">
            {DOCS.map((d: DocItem) => (
              <button key={d.href} type="button" className="doc-row" onClick={() => go(d.href)}>
                <div className="doc-row-title">{d.title}</div>
                <div className="doc-row-desc">{d.desc}</div>
              </button>
            ))}
          </div>

        {/* Блок 2 — реквизиты */}
        <div className="miniinfo-block">
          <h2 className="miniinfo-title">Реквизиты оператора</h2>

          <div className="req">
            <div className="req-line">
              <span className="req-k">ИП</span>
              <span className="req-v">МЕНЬШАКОВА А.С.</span>
            </div>

            <div className="req-line">
              <span className="req-k">ИНН</span>
              <span className="req-v">290221242314</span>
            </div>

            <div className="req-line">
              <span className="req-k">ОГРНИП</span>
              <span className="req-v">325290000042402</span>
            </div>

            <div className="req-line">
              <span className="req-k">Email</span>
              <span className="req-v">
                <a href="mailto:vrachi.tut@yandex.ru">vrachi.tut@yandex.ru</a>
              </span>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        .miniinfo {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif;
        }

        .miniinfo-block {
          background: #ffffff;
          border-radius: 20px;
          padding: 18px 16px 18px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
        }

        .miniinfo-title {
          margin: 0 0 12px;
          font-size: 20px;
          line-height: 1.25;
          font-weight: 900;
          color: #111827;
          position: relative;
          word-break: break-word;
        }

        .miniinfo-title::after {
          content: '';
          display: block;
          width: 56px;
          height: 3px;
          border-radius: 999px;
          background: #24c768;
          margin-top: 6px;
        }

        .docs {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* теперь это просто “кнопка-карточка” без надписи Открыть */
        .doc-row {
          width: 100%;
          text-align: left;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #ffffff;
          border-radius: 16px;
          padding: 14px 14px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.04);
        }

        .doc-row:active {
          transform: scale(0.99);
          opacity: 0.96;
        }

        .doc-row-title {
          font-size: 16px;
          font-weight: 900;
          color: #111827;
          line-height: 1.25;
          word-break: break-word;
        }

        .doc-row-desc {
          margin-top: 8px;
          font-size: 14px;
          line-height: 1.45;
          color: rgba(17, 24, 39, 0.62);
          word-break: break-word;
        }

        .meta {
          margin-top: 12px;
          font-size: 13px;
          color: rgba(17, 24, 39, 0.62);
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .meta-dot {
          color: rgba(17, 24, 39, 0.45);
        }

        .req {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 2px;
        }

        .req-line {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .req-k {
          width: 64px;
          flex: 0 0 64px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.75);
          text-transform: uppercase;
          letter-spacing: 0.02em;
          line-height: 1.2;
          padding-top: 2px;
        }

        .req-v {
          flex: 1 1 auto;
          font-size: 14px;
          line-height: 1.35;
          color: rgba(17, 24, 39, 0.82);
          word-break: break-word;
        }

        a {
          color: rgba(17, 24, 39, 0.85);
          font-weight: 800;
          text-decoration: none;
          word-break: break-word;
        }

        @media (max-width: 360px) {
          .req-k {
            width: 56px;
            flex-basis: 56px;
          }
          .miniinfo-block {
            padding: 16px 14px 16px;
          }
          .doc-row {
            padding: 13px 13px;
          }
        }
      `}</style>
    </main>
  );
}
