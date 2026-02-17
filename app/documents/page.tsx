/* path: app/documents/page.tsx */
'use client';

import Link from 'next/link';
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

export default function DocumentsIndexPage() {
  return (
    <DocumentShell
      title="Документы"
      subtitle="Официальные правила и политики сервиса"
      updatedAt="1.0"
      crumbs={[]}
    >
      <section className="list">
        <p className="lead">
          Здесь лежат юридические документы сервиса{' '}
          <span className="brand">
            <span className="brand-main">ВРАЧИ</span>
            <span className="brand-dot">.</span>
            <span className="brand-accent">ТУТ</span>
          </span>
          . Их можно открыть из оплаты и профиля.
        </p>

        <div className="grid">
          {DOCS.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="card"
              onClick={() => haptic('light')}
            >
              <div className="card-title">{d.title}</div>
              <div className="card-desc">{d.desc}</div>
              <div className="card-go">Открыть →</div>
            </Link>
          ))}
        </div>

        <div className="requisites">
          <div className="req-title">Реквизиты оператора</div>
          <div className="req-line">
            <b>ИП</b> Меньшакова Анастасия Сергеевна
          </div>
          <div className="req-line">
            <b>ИНН</b> 290221242314
          </div>
          <div className="req-line">
            <b>ОГРНИП</b> 325290000042402
          </div>
          <div className="req-line">
            <b>Email</b> vrachi.tut@yandex.ru
          </div>
        </div>
      </section>

      <style jsx>{`
        .list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .lead {
          margin: 0;
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

        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        @media (min-width: 720px) {
          .grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .card {
          text-decoration: none;
          color: inherit;
          background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 18px;
          padding: 14px 14px 12px;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
          -webkit-tap-highlight-color: transparent;
        }

        .card:active {
          transform: scale(0.99);
        }

        .card-title {
          font-size: 15px;
          font-weight: 900;
          line-height: 1.25;
          margin-bottom: 6px;
        }

        .card-desc {
          font-size: 13px;
          line-height: 1.5;
          color: rgba(17, 24, 39, 0.65);
          margin-bottom: 10px;
        }

        .card-go {
          font-size: 13px;
          font-weight: 900;
          color: #24c768;
        }

        .requisites {
          margin-top: 8px;
          border-radius: 18px;
          padding: 14px 14px 12px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          background: rgba(255, 255, 255, 0.9);
        }

        .req-title {
          font-size: 14px;
          font-weight: 900;
          margin-bottom: 10px;
        }

        .req-line {
          font-size: 13px;
          line-height: 1.55;
          color: rgba(17, 24, 39, 0.72);
        }
      `}</style>
    </DocumentShell>
  );
}
