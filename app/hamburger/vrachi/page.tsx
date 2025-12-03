/* path: app/hamburger/vrachi/page.tsx */
'use client';

import TopBarBack from '../../../components/TopBarBack';

const GROUPS: { letter: string; items: string[] }[] = [
  {
    letter: 'А',
    items: [
      'Акушер',
      'Аллерголог-Иммунолог',
      'Андролог',
      'Анестезиолог-реаниматолог',
      'Аритмолог',
    ],
  },
  {
    letter: 'В',
    items: [
      'Венеролог',
      'Ветеринар',
      'Врач КДЛ',
      'Врач ЛФК',
      'Врач медико-социальной экспертизы',
      'Врач скорой помощи',
      'Врач УЗД',
      'Врач-генетик',
    ],
  },
  {
    letter: 'Г',
    items: [
      'Гастроэнтеролог',
      'Гематолог',
      'Гепатолог',
      'Гериатр',
      'Гинеколог',
      'Гинеколог-эндокринолог',
      'Гомеопат',
    ],
  },
  {
    letter: 'Д',
    items: [
      'Дерматолог',
      'Детский гинеколог',
      'Детский дерматолог',
      'Детский кардиолог',
      'Детский ЛОР',
      'Детский невролог',
      'Детский стоматолог',
      'Детский хирург',
      'Детский эндокринолог',
      'Диетолог',
    ],
  },
  {
    letter: 'И',
    items: ['Инфекционист'],
  },
  {
    letter: 'К',
    items: [
      'Кардиолог',
      'Кардиохирург',
      'Клинический фармаколог',
      'Косметолог',
    ],
  },
  {
    letter: 'Л',
    items: ['Логопед', 'ЛОР'],
  },
  {
    letter: 'М',
    items: ['Маммолог', 'Мануальный терапевт', 'Массажист'],
  },
  {
    letter: 'Н',
    items: [
      'Нарколог',
      'Невролог',
      'Нейрохирург',
      'Нефролог',
      'Нутрициолог',
    ],
  },
  {
    letter: 'О',
    items: ['Онколог', 'Ортодонт', 'Ортопед', 'Офтальмолог'],
  },
  {
    letter: 'П',
    items: [
      'Педиатр',
      'Пластический хирург',
      'Проктолог',
      'Психиатр',
      'Психолог',
      'Психотерапевт',
      'Пульмонолог',
    ],
  },
  {
    letter: 'Р',
    items: ['Рабиолог', 'Ревматолог', 'Рентгенолог', 'Репродуктолог'],
  },
  {
    letter: 'С',
    items: [
      'Сексолог',
      'Сомнолог',
      'Сосудистый хирург',
      'Стоматолог',
      'Сурдолог',
    ],
  },
  {
    letter: 'Т',
    items: ['Терапевт', 'Травматолог', 'Трихолог'],
  },
  {
    letter: 'У',
    items: ['Уролог'],
  },
  {
    letter: 'Ф',
    items: [
      'Фармацевт',
      'Физиотерапевт',
      'Флеболог',
      'Фтизиатр',
      'Функциональный диагност',
    ],
  },
  {
    letter: 'Х',
    items: ['Хирург', 'Хирург-стоматолог'],
  },
  {
    letter: 'Э',
    items: ['Эндокринолог'],
  },
];

export default function VrachiPage() {
  return (
    <main className="vrachi-page">
      {/* Топбар с кнопкой "Назад" и логотипом по центру */}
      <TopBarBack />

      {/* Просто список на странице, без лишних контейнеров сверху */}
      {GROUPS.map((group) => (
        <div key={group.letter} className="vrachi-group">
          <div className="vrachi-letter">{group.letter}</div>
          {group.items.map((name) => (
            <div key={name} className="vrachi-item">
              {name}
            </div>
          ))}
        </div>
      ))}

      <style jsx>{`
        .vrachi-page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px);
          display: flex;
          flex-direction: column;
          gap: 18px;
          /* не красим фон в белый, чтобы не было белой простыни поверх градиента */
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI',
            sans-serif;
        }

        .vrachi-group {
          margin-top: 8px;
        }

        .vrachi-letter {
          font-size: 28px;
          font-weight: 800;
          color: #24c768;
          margin-bottom: 8px;
        }

        .vrachi-item {
          font-size: 16px;
          line-height: 1.45;
          color: #374151;
          margin-bottom: 8px;
        }
      `}</style>
    </main>
  );
}
