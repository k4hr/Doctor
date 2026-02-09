/* path: app/hamburger/vrachi/page.tsx */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../components/TopBarBack';
import DownBar from '../../../components/DownBar';
import { VRACHI_GROUPS } from '../../lib/vrachi';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

export default function VrachiPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      (window as any)?.Telegram?.WebApp?.ready?.();
      (window as any)?.Telegram?.WebApp?.expand?.();
    } catch {}
  }, []);

  const go = (speciality: string) => {
    haptic('light');
    router.push(`/hamburger/vrachi/${encodeURIComponent(speciality)}`);
  };

  return (
    <main className="feed">
      <TopBarBack />

      <section className="feed-main">
        <section className="vrachi-list" aria-label="Список специализаций">
          {VRACHI_GROUPS.map((group) => (
            <div key={group.letter} className="vrachi-group">
              <div className="vrachi-letter">{group.letter}</div>

              {group.items.map((name) => (
                <button key={name} type="button" className="vrachi-item" onClick={() => go(name)}>
                  {name}
                </button>
              ))}
            </div>
          ))}
        </section>

        <DownBar />
      </section>

      <style jsx>{`
        /* ✅ 1в1 как на app/page.tsx */
        .feed {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        .feed-main {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding-bottom: 72px;
        }

        .vrachi-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
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
