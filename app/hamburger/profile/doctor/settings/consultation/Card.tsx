/* path: app/hamburger/profile/doctor/settings/consultation/Card.tsx */
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

type ConsultationStatusUI = 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CLOSED';
type PriceBadge = 'PAID' | 'FREE';

export type ConsultationCardData = {
  id: string;

  // немного текста (описание проблемы)
  bodySnippet: string;

  createdAt: string | Date;

  // цена
  priceRub: number;
  priceBadge?: PriceBadge; // если не передашь — считаем платной, когда priceRub > 0

  // статус
  status: ConsultationStatusUI;
};

type Props = {
  c: ConsultationCardData;
  hrefBase?: string; // куда открывать карточку консультации
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

function safeSnippet(s: any) {
  const t = String(s ?? '').trim();
  if (!t) return '—';
  // слегка чистим переносы, чтобы выглядело как сниппет
  const oneLine = t.replace(/\s+/g, ' ').trim();
  return oneLine.length > 120 ? oneLine.slice(0, 120).trim() + '…' : oneLine;
}

function priceLabel(c: ConsultationCardData) {
  const badge =
    c.priceBadge ||
    (typeof c.priceRub === 'number' && Number.isFinite(c.priceRub) && c.priceRub > 0 ? 'PAID' : 'FREE');

  if (badge === 'PAID') return { text: `${Math.round(Number(c.priceRub) || 0)} ₽`, tone: 'gold' as const };
  return { text: 'Бесплатно', tone: 'free' as const };
}

function statusLabel(c: ConsultationCardData) {
  const st = String(c.status || 'PENDING').toUpperCase() as ConsultationStatusUI;

  // стилистика как у вопросов: синие/зелёные/серые плашки
  if (st === 'ACCEPTED') return { text: 'Принята', tone: 'green' as const };
  if (st === 'DECLINED') return { text: 'Отказана', tone: 'red' as const };
  if (st === 'CLOSED') return { text: 'Закрыта', tone: 'gray' as const };
  if (st === 'DRAFT') return { text: 'Черновик', tone: 'gray' as const };

  return { text: 'Ожидает решения', tone: 'blue' as const }; // PENDING
}

export default function ConsultationCard({ c, hrefBase = '/hamburger/profile/doctor/settings/consultation' }: Props) {
  const router = useRouter();

  const ui = useMemo(() => {
    const st = statusLabel(c);
    const pr = priceLabel(c);
    return {
      statusText: st.text,
      statusTone: st.tone,
      priceText: pr.text,
      priceTone: pr.tone,
      snippet: safeSnippet(c.bodySnippet),
      time: timeAgoRu(c.createdAt),
    };
  }, [c]);

  const onOpen = () => {
    haptic('light');
    router.push(`${hrefBase}/${encodeURIComponent(c.id)}`);
  };

  return (
    <>
      <button type="button" className="cc" onClick={onOpen} aria-label="Открыть консультацию">
        <div className="ccTop">
          <div className="ccText">
            <div className="ccTitle">Консультация</div>
            <div className="ccSnippet">{ui.snippet}</div>
          </div>

          <div className="ccRight">
            <span className={`ccPill ${ui.priceTone === 'gold' ? 'ccPill--gold' : 'ccPill--free'}`}>{ui.priceText}</span>

            <span
              className={`ccPill ${
                ui.statusTone === 'green'
                  ? 'ccPill--green'
                  : ui.statusTone === 'blue'
                  ? 'ccPill--blue'
                  : ui.statusTone === 'red'
                  ? 'ccPill--red'
                  : 'ccPill--gray'
              }`}
            >
              {ui.statusText}
            </span>
          </div>
        </div>

        <div className="ccBottom">
          <span className="ccTime">{ui.time}</span>
        </div>
      </button>

      <style jsx>{`
        .cc {
          width: 100%;
          text-align: left;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;

          border: 1px solid rgba(10, 12, 20, 0.08);
          background: rgba(255, 255, 255, 0.96);
          border-radius: 18px;

          padding: 10px 12px 9px;

          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.07);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);

          position: relative;

          display: flex;
          flex-direction: column;

          height: 92px;
          overflow: hidden;

          justify-content: space-between;
        }

        .cc::after {
          content: '';
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 0px;

          height: 1px;
          background: rgba(15, 23, 42, 0.08);

          transform: scaleY(0.5);
          transform-origin: bottom;
          pointer-events: none;
        }

        .cc:active {
          transform: translateY(1px);
          box-shadow: 0 6px 18px rgba(18, 28, 45, 0.11);
        }

        .ccTop {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: start;
          gap: 10px;
          min-width: 0;
        }

        .ccText {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .ccTitle {
          font-size: 12px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.8);
          line-height: 1.05;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ccSnippet {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #022c22;

          line-height: 16px;
          height: 32px;
          max-height: 32px;

          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-width: 0;
        }

        .ccRight {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .ccPill {
          flex: 0 0 auto;

          font-size: 11px;
          font-weight: 600;
          padding: 4px 9px;

          border-radius: 999px;
          border: 1px solid transparent;
          white-space: nowrap;
          line-height: 1.05;
        }

        .ccPill--free {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.1);
          color: rgba(15, 23, 42, 0.7);
        }

        .ccPill--gold {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.3);
          color: #92400e;
        }

        .ccPill--green {
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.3);
          color: rgba(22, 163, 74, 1);
        }

        .ccPill--blue {
          background: rgba(59, 130, 246, 0.12);
          border-color: rgba(59, 130, 246, 0.3);
          color: rgba(37, 99, 235, 1);
        }

        .ccPill--red {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.28);
          color: rgba(185, 28, 28, 1);
        }

        .ccPill--gray {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.12);
          color: rgba(15, 23, 42, 0.7);
        }

        .ccBottom {
          display: flex;
          justify-content: flex-end;
          align-items: end;
          min-width: 0;
          margin-top: 2px;
        }

        .ccTime {
          white-space: nowrap;
          font-size: 11px;
          font-weight: 600;
          color: rgba(15, 23, 42, 0.62);
          line-height: 1.05;
        }
      `}</style>
    </>
  );
}
