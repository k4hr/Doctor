/* path: app/hamburger/vrachi/page.tsx */
'use client';

import TopBarBack from '../../../components/TopBarBack';
import DownBar from '../../../components/DownBar';
import { VRACHI_GROUPS } from '../../lib/vrachi';

export default function VrachiPage() {
  return (
    <main className="vrachi-page">
      {/* sticky-топбар с кнопкой "Назад" */}
      <TopBarBack />

      {/* Основное содержимое + DownBar внизу */}
      <section className="vrachi-main">
        {VRACHI_GROUPS.map((group) => (
          <div key={group.letter} className="vrachi-group">
            <div className="vrachi-letter">{group.letter}</div>
            {group.items.map((name) => (
              <div key={name} className="vrachi-item">
                {name}
              </div>
            ))}
          </div>
        ))}

        {/* DownBar — просто последний блок страницы */}
        <DownBar />
      </section>

      <style jsx>{`
        .vrachi-page {
          min-height: 100dvh;
          padding: 16px 16px
            calc(env(safe-area-inset-bottom, 0px) + 24px);
          /* TopBarBack sticky внутри всего main, в том числе над DownBar */
          font-family: Montserrat, Manrope, system-ui, -apple-system,
            'Segoe UI', sans-serif;
        }

        .vrachi-main {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-bottom: 72px; /* чуть-чуть запаса, чтобы было что доскроллить */
        }

        .vrachi-group {
          margin-top: 4px;
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
