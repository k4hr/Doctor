/* path: app/vopros/main/QuestionCard.tsx */
'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

type QuestionStatusUI = 'ANSWERING' | 'WAITING';
type PriceBadge = 'FREE' | 'PAID';

export type QuestionCardData = {
  id: string;

  title: string;
  bodySnippet: string;
  createdAt: string | Date;

  doctorLabel: string;

  status: QuestionStatusUI;

  priceBadge: PriceBadge;
};

type Props = {
  q: QuestionCardData;
  hrefBase?: string;
};

type TgWebApp = {
  HapticFeedback?: { impactOccurred?: (type: 'light' | 'medium') => void };
};

function tg(): TgWebApp | null {
  try {
    return (window as any)?.Telegram?.WebApp || null;
  } catch {
    return null;
  }
}

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    tg()?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

function clampText(s: string, max = 110) {
  const t = String(s || '').trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
}

function timeAgoRu(input: string | Date) {
  const d = input instanceof Date ? input : new Date(input);
  const ts = d.getTime();
  if (!Number.isFinite(ts)) return '—';

  const diffMs = Date.now() - ts;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 60) return 'только что';

  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} мин назад`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч назад`;

  const days = Math.floor(hr / 24);
  if (days === 1) return '1 день назад';
  if (days >= 2 && days <= 4) return `${days} дня назад`;
  return `${days} дней назад`;
}

export default function QuestionCard({ q, hrefBase = '/vopros' }: Props) {
  const router = useRouter();

  const ui = useMemo(() => {
    const isAnswering = q.status === 'ANSWERING';
    return {
      statusText: isAnswering ? 'Врач отвечает' : 'Ждёт ответа',
      statusClass: isAnswering ? 'status status--green' : 'status status--gray',

      priceText: q.priceBadge === 'PAID' ? 'Платно' : 'Бесплатно',
      priceClass: q.priceBadge === 'PAID' ? 'price price--gold' : 'price price--free',
    };
  }, [q.status, q.priceBadge]);

  const onOpen = () => {
    haptic('light');
    router.push(`${hrefBase}/${encodeURIComponent(q.id)}`);
  };

  return (
    <>
      <button type="button" className="card" onClick={onOpen} aria-label={`Открыть вопрос: ${q.title}`}>
        <div className="top">
          <h2 className="title">{q.title}</h2>
          <span className={ui.statusClass}>{ui.statusText}</span>
        </div>

        <p className="snippet">{clampText(q.bodySnippet, 140)}</p>

        <div className="bottom">
          <span className="doctor">{q.doctorLabel}</span>
          <span className={ui.priceClass}>{ui.priceText}</span>
          <span className="time">{timeAgoRu(q.createdAt)}</span>
        </div>
      </button>

      <style jsx>{`
        .card {
          width: 100%;
          text-align: left;

          border: 1px solid rgba(10, 12, 20, 0.08);
          background: rgba(255, 255, 255, 0.92);
          border-radius: 18px;

          padding: 14px 14px 12px;

          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);

          display: grid;
          gap: 8px;

          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .card:active {
          transform: translateY(1px);
          box-shadow: 0 6px 18px rgba(18, 28, 45, 0.12);
        }

        .top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .title {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
          color: #0b0c10;
          letter-spacing: -0.01em;
          line-height: 1.15;
        }

        .status {
          font-size: 12px;
          font-weight: 800;
          padding: 7px 12px;
          border-radius: 999px;
          white-space: nowrap;
          border: 1px solid transparent;
        }

        .status--green {
          background: rgba(36, 199, 104, 0.10);
          border-color: rgba(36, 199, 104, 0.30);
          color: #166534;
        }

        .status--gray {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.12);
          color: rgba(15, 23, 42, 0.70);
        }

        .snippet {
          margin: 0;
          font-size: 14px;
          line-height: 1.45;
          color: rgba(11, 12, 16, 0.75);
        }

        .bottom {
          margin-top: 2px;
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          gap: 10px;
          font-size: 12px;
        }

        .doctor {
          justify-self: start;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.04);
          color: rgba(15, 23, 42, 0.85);
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        .price {
          justify-self: center;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid transparent;
          font-weight: 900;
          white-space: nowrap;
        }

        .price--free {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.10);
          color: rgba(15, 23, 42, 0.70);
        }

        .price--gold {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.30);
          color: #92400e;
        }

        .time {
          justify-self: end;
          color: rgba(15, 23, 42, 0.55);
          white-space: nowrap;
          font-weight: 700;
        }
      `}</style>
    </>
  );
}
