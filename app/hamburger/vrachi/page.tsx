'use client';

import TopBarBack from '../../../components/TopBarBack';
import { VRACHI_GROUPS } from '../../lib/vrachi';

export default function VrachiPage() {
  return (
    <main className="vrachi-page">
      {/* Топбар с кнопкой "Назад" и логотипом по центру */}
      <TopBarBack />

      {/* Просто список на странице, без лишних контейнеров сверху */}
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

      <style jsx>{`
        .vrachi-page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px);
          display: flex;
          flex-direction: column;
          gap: 18px;
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
