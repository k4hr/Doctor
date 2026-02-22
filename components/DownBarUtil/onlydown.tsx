/* path:components/DownBarUtil/onlydown.tsx */
'use client';

import { useRouter } from 'next/navigation';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

type LinkItem = {
  label: string;
  href: string;
};

export default function OnlyDown() {
  const router = useRouter();

  const go = (href: string) => {
    haptic('light');
    router.push(href);
  };

  const colUsers: LinkItem[] = [
    { label: 'Задать вопрос врачу', href: '/vopros' },
    { label: 'О нас', href: '/about' },
    { label: 'Помощь', href: '/help' },
  ];

  const colDoctors: LinkItem[] = [
    { label: 'Сотрудничество для врачей', href: '/hamburger/vracham' },
    { label: 'Помощь', href: '/help' },
    { label: 'Заполнение профиля', href: '/hamburger/profile' },
    { label: 'Наши врачи', href: '/doctors' },
  ];

  const colDocs: LinkItem[] = [
    { label: 'Соглашение для пользователей', href: '/docs/user-agreement' },
    { label: 'Соглашение для врачей', href: '/docs/doctor-agreement' },
    { label: 'Обработка персональных данных', href: '/docs/privacy' },
    { label: 'Редакционная политика', href: '/docs/editorial' },
    { label: 'Технологии', href: '/docs/tech' },
  ];

  const colContacts: LinkItem[] = [{ label: 'Контакты', href: '/contacts' }];

  return (
    <>
      <footer className="od" aria-label="Нижняя панель">
        <div className="odInner">
          <div className="cols">
            <div className="col">
              <div className="h">Пользователям</div>
              <div className="list">
                {colUsers.map((x) => (
                  <button key={x.href} type="button" className="a" onClick={() => go(x.href)}>
                    {x.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col">
              <div className="h">Врачам</div>
              <div className="list">
                {colDoctors.map((x) => (
                  <button key={x.href} type="button" className="a" onClick={() => go(x.href)}>
                    {x.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col">
              <div className="h">Документы</div>
              <div className="list">
                {colDocs.map((x) => (
                  <button key={x.href} type="button" className="a" onClick={() => go(x.href)}>
                    {x.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col">
              <div className="h">Контакты</div>
              <div className="list">
                {colContacts.map((x) => (
                  <button key={x.href} type="button" className="a" onClick={() => go(x.href)}>
                    {x.label}
                  </button>
                ))}
                <div className="contactLine">
                  <span className="muted">Почта:</span> <span className="mail">vrachi.tut@yandex.ru</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sep" />

          <div className="ip">
            <div className="ipTitle">ИП МЕНЬШАКОВА А.С</div>
            <div className="ipRow">ОГРН 325290000042402, ИНН 290221242314</div>

            <div className="disc">
              Напоминаем, что консультации специалистов сайта даются исключительно в справочных целях и не являются
              постановкой диагноза или основанием для назначения лечения. Необходима очная консультация специалиста, в
              том числе для выявления возможных противопоказаний.
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .od {
          width: 100%;
          background: #ffffff;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          padding: 26px 16px 18px;
          margin-top: 22px;
        }

        /* чтобы реально “прилипало” к низу, родителю нужно:
           min-height: 100dvh; display:flex; flex-direction:column;
           и на контенте flex:1; а этот футер просто внизу */
        .odInner {
          max-width: 1080px;
          margin: 0 auto;
        }

        .cols {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 28px;
        }

        .col {
          min-width: 0;
        }

        .h {
          font-size: 15px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.92);
          margin-bottom: 10px;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .a {
          appearance: none;
          border: none;
          background: transparent;
          padding: 0;
          text-align: left;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;

          font-size: 13px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.62);
          line-height: 1.35;
        }

        .a:active {
          opacity: 0.75;
        }

        .contactLine {
          margin-top: 6px;
          font-size: 13px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.62);
        }

        .muted {
          color: rgba(17, 24, 39, 0.5);
        }

        .mail {
          color: rgba(17, 24, 39, 0.72);
          font-weight: 900;
          word-break: break-word;
        }

        .sep {
          height: 1px;
          background: rgba(15, 23, 42, 0.08);
          margin: 18px 0 16px;
        }

        .ip {
          display: grid;
          gap: 8px;
          text-align: center;
        }

        .ipTitle {
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.55);
          letter-spacing: 0.04em;
        }

        .ipRow {
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.5);
        }

        .disc {
          margin-top: 8px;
          font-size: 11px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.46);
          line-height: 1.45;
          max-width: 980px;
          margin-left: auto;
          margin-right: auto;
        }

        @media (max-width: 980px) {
          .cols {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }
        }

        @media (max-width: 520px) {
          .od {
            padding: 20px 14px 16px;
          }
          .cols {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>
    </>
  );
}
