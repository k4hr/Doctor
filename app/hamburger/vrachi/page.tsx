/* path: app/hamburger/vrachi/page.tsx */
'use client';

import { useRouter } from 'next/navigation';
import TopBarBack from '../../../components/TopBarBack';
import DownBar from '../../../components/DownBar';
import { VRACHI_GROUPS } from '../../lib/vrachi';

export default function VrachiPage() {
  const router = useRouter();

  const go = (speciality: string) => {
    router.push(`/hamburger/vrachi/${encodeURIComponent(speciality)}`);
  };

  return (
    <main className="vrachi-page">
      <TopBarBack />

      <section className="vrachi-main">
        {VRACHI_GROUPS.map((group) => (
          <div key={group.letter} className="vrachi-group">
            <div className="vrachi-letter">{group.letter}</div>

            {group.items.map((name) => (
              <button
                key={name}
                type="button"
                className="vrachi-item"
                onClick={() => go(name)}
              >
                {name}
              </button>
            ))}
          </div>
        ))}

        <DownBar />
      </section>

      <style jsx>{`
        .vrachi-page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif;
        }

        .vrachi-main {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-bottom: 72px;
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
          width: 100%;
          text-align: left;
          padding: 10px 0;
          background: transparent;
          border: 0;
          font-size: 16px;
          line-height: 1.45;
          color: #374151;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .vrachi-item:active {
          opacity: 0.7;
          transform: scale(0.995);
        }
      `}</style>
    </main>
  );
}
