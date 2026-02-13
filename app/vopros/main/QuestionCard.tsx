/* path: app/vopros/main/QuestionCard.tsx */
'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

type QuestionStatusUI = 'WAITING' | 'ANSWERING' | 'CLOSED';
type PriceBadge = 'FREE' | 'PAID';

export type QuestionCardData = {
  id: string;

  title: string;
  bodySnippet: string;
  createdAt: string | Date;

  doctorLabel: string;
  authorLabel?: string;

  status: QuestionStatusUI;
  answersCount?: number;

  priceText?: string;
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

function answersSuffix(cnt: number) {
  const n = Math.max(0, Math.trunc(cnt));
  const mod10 = n % 10;
  const mod100 = n % 100;

  // 1 ответ, 2-4 ответа, 5-20 ответов, 21 ответ, 22-24 ответа, ...
  if (mod10 === 1 && mod100 !== 11) return '';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'а';
  return 'ов';
}

function statusLabel(q: QuestionCardData) {
  const st = String(q.status || 'WAITING').toUpperCase() as QuestionStatusUI;
  const cnt = Number.isFinite(q.answersCount as number) ? Math.max(0, Number(q.answersCount)) : 0;

  // ✅ ЗАКРЫТ — ЗЕЛЁНЫЙ
  if (st === 'CLOSED') return { text: 'Вопрос закрыт', tone: 'green' as const };

  // ✅ ЕСТЬ ОТВЕТЫ — ГОЛУБОЙ (счётчик)
  if (cnt > 0) return { text: `${cnt} ответ${answersSuffix(cnt)}`, tone: 'blue' as const };

  // ✅ НЕТ ОТВЕТОВ — СЕРЫЙ
  return { text: 'Ждёт ответа', tone: 'gray' as const };
}

function priceLabel(q: QuestionCardData) {
  if (q.priceBadge === 'PAID') {
    return { text: (q.priceText || 'Платно').trim(), tone: 'gold' as const };
  }
  return { text: 'Бесплатно', tone: 'free' as const };
}

function authorLabelSafe(q: QuestionCardData) {
  const s = String(q.authorLabel || '').trim();
  return s || 'Вопрос от Анонимно';
}

export default function QuestionCard({ q, hrefBase = '/vopros' }: Props) {
  const router = useRouter();

  const ui = useMemo(() => {
    const st = statusLabel(q);
    const pr = priceLabel(q);

    return {
      statusText: st.text,
      statusTone: st.tone,
      priceText: pr.text,
      priceTone: pr.tone,
    };
  }, [q]);

  const onOpen = () => {
    haptic('light');
    router.push(`${hrefBase}/${encodeURIComponent(q.id)}`);
  };

  return (
    <>
      <button type="button" className="qc" onClick={onOpen} aria-label={`Открыть вопрос: ${q.title}`}>
        <div className="qcTop">
          <div className="qcTopLeft">
            <div className="qcAuthorTop">{authorLabelSafe(q)}</div>
            <h2 className="qcTitle">{q.title}</h2>
          </div>

          <div className="qcRight">
            <span className={`qcPill ${ui.priceTone === 'gold' ? 'qcPill--gold' : 'qcPill--free'}`}>{ui.priceText}</span>

            <span
              className={`qcPill ${
                ui.statusTone === 'green'
                  ? 'qcPill--green'
                  : ui.statusTone === 'blue'
                  ? 'qcPill--blue'
                  : ui.statusTone === 'gray'
                  ? 'qcPill--gray'
                  : 'qcPill--gray'
              }`}
            >
              {ui.statusText}
            </span>
          </div>
        </div>

        <div className="qcBottom">
          <span className="qcDoctorText">{q.doctorLabel}</span>
          <span className="qcTime">{timeAgoRu(q.createdAt)}</span>
        </div>
      </button>

      <style jsx>{`
        .qc {
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

          height: 90px;
          overflow: hidden;

          justify-content: space-between;
        }

        .qc::after {
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

        .qc:active {
          transform: translateY(1px);
          box-shadow: 0 6px 18px rgba(18, 28, 45, 0.11);
        }

        .qcTop {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: start;
          gap: 10px;
          min-width: 0;

          flex: 0 0 auto;
          min-height: 0;
        }

        .qcBottom {
          flex: 0 0 auto;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: end;
          gap: 10px;
          min-width: 0;
          min-height: 0;

          margin-top: 2px;
        }

        .qcTopLeft {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          min-height: 0;
        }

        .qcAuthorTop {
          font-size: 12px;
          font-weight: 600;
          color: rgba(15, 23, 42, 0.8);
          line-height: 1.05;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .qcTitle {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #022c22;
          letter-spacing: 0;

          line-height: 16px;
          height: 32px;
          max-height: 32px;

          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-width: 0;
        }

        .qcRight {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .qcPill {
          flex: 0 0 auto;

          font-size: 11px;
          font-weight: 600;
          padding: 4px 9px;

          border-radius: 999px;
          border: 1px solid transparent;
          white-space: nowrap;
          line-height: 1.05;
        }

        .qcPill--free {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.1);
          color: rgba(15, 23, 42, 0.7);
        }

        .qcPill--gold {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.3);
          color: #92400e;
        }

        /* ✅ ЗЕЛЁНЫЙ — как в ovrachax (green) */
        .qcPill--green {
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.3);
          color: rgba(22, 163, 74, 1);
        }

        /* ✅ ГОЛУБОЙ — как в ovrachax (blue) */
        .qcPill--blue {
          background: rgba(59, 130, 246, 0.12);
          border-color: rgba(59, 130, 246, 0.3);
          color: rgba(37, 99, 235, 1);
        }

        .qcPill--gray {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.12);
          color: rgba(15, 23, 42, 0.7);
        }

        .qcDoctorText {
          font-size: 12px;
          font-weight: 600;
          color: rgba(15, 23, 42, 0.8);
          line-height: 1.05;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .qcTime {
          justify-self: end;
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
