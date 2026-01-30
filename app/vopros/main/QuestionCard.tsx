/* path: app/vopros/main/QuestionCard.tsx */
'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

type QuestionStatusUI = 'WAITING' | 'ANSWERING' | 'CLOSED';
type PriceBadge = 'FREE' | 'PAID';

export type QuestionCardData = {
  id: string;

  title: string;
  bodySnippet: string; // остаётся в данных, но на карточке НЕ показываем
  createdAt: string | Date;

  doctorLabel: string;

  // ✅ новое: строка "Вопрос от ..."
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

function statusLabel(q: QuestionCardData) {
  const st = String(q.status || 'WAITING').toUpperCase();
  const n = Number.isFinite(q.answersCount as number) ? Number(q.answersCount) : 0;

  if (st === 'CLOSED') return { text: 'Вопрос закрыт', tone: 'red' as const };

  if (st === 'ANSWERING') {
    const cnt = Math.max(0, n);
    if (cnt <= 0) return { text: 'Ждёт ответа', tone: 'gray' as const };

    const suf =
      cnt % 10 === 1 && cnt % 100 !== 11
        ? ''
        : cnt % 10 >= 2 && cnt % 10 <= 4 && (cnt % 100 < 10 || cnt % 100 >= 20)
        ? 'а'
        : 'ов';

    return { text: `${cnt} ответ${suf}`, tone: 'green' as const };
  }

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
          <h2 className="qcTitle">{q.title}</h2>

          <div className="qcRight">
            <span className={`qcPill ${ui.priceTone === 'gold' ? 'qcPill--gold' : 'qcPill--free'}`}>
              {ui.priceText}
            </span>

            <span
              className={`qcPill ${
                ui.statusTone === 'green'
                  ? 'qcPill--green'
                  : ui.statusTone === 'red'
                  ? 'qcPill--red'
                  : 'qcPill--gray'
              }`}
            >
              {ui.statusText}
            </span>
          </div>
        </div>

        <div className="qcBottom">
          <div className="qcMetaLeft">
            <span className="qcDoctorText">{q.doctorLabel}</span>
            <span className="qcAuthorText">{authorLabelSafe(q)}</span>
          </div>

          <span className="qcTime">{timeAgoRu(q.createdAt)}</span>
        </div>
      </button>

      <style jsx>{`
        /* iOS-стайл: плотная компоновка без пустоты */
        .qc {
          width: 100%;
          text-align: left;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;

          border: 1px solid rgba(10, 12, 20, 0.08);
          background: rgba(255, 255, 255, 0.96);
          border-radius: 18px;

          /* меньше воздуха */
          padding: 10px 12px 9px;

          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.07);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);

          /* hairline divider снизу (как в iOS списках) */
          position: relative;
        }

        .qc::after {
          content: '';
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 0px;

          height: 1px;
          background: rgba(15, 23, 42, 0.08);

          /* 0.5px на retina: “тонкая линия” */
          transform: scaleY(0.5);
          transform-origin: bottom;
          pointer-events: none;
        }

        /* КЛЮЧ: flex + space-between убирает “пустые этажи” */
        .qc {
          display: flex;
          flex-direction: column;
          justify-content: space-between;

          /* компактнее, но с местом под "Вопрос от ..." */
          height: 104px;
          overflow: hidden;
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
        }

        /* чуть “жирнее iOS”: заголовок плотный */
        .qcTitle {
          margin: 0;
          font-size: 15px;
          font-weight: 900;
          color: #0b0c10;
          letter-spacing: -0.01em;
          line-height: 1.06;

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
          gap: 4px; /* меньше расстояние между “Бесплатно” и “Ждёт ответа” */
        }

        /* Плашки — более компактные, чтобы не раздували карточку */
        .qcPill {
          flex: 0 0 auto;

          font-size: 9px;
          font-weight: 900;
          padding: 4px 9px;

          border-radius: 999px;
          border: 1px solid transparent;
          white-space: nowrap;
          line-height: 1.05;
        }

        .qcPill--free {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.10);
          color: rgba(15, 23, 42, 0.70);
        }

        .qcPill--gold {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.30);
          color: #92400e;
        }

        .qcPill--green {
          background: rgba(36, 199, 104, 0.10);
          border-color: rgba(36, 199, 104, 0.30);
          color: #166534;
        }

        .qcPill--gray {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.12);
          color: rgba(15, 23, 42, 0.70);
        }

        .qcPill--red {
          background: rgba(239, 68, 68, 0.10);
          border-color: rgba(239, 68, 68, 0.26);
          color: #991b1b;
        }

        .qcBottom {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: end;
          gap: 10px;
          min-width: 0;
        }

        .qcMetaLeft {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        /* Специальность — текстом, но “собранно” */
        .qcDoctorText {
          font-size: 12px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.72);
          line-height: 1.05;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .qcAuthorText {
          font-size: 11px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.58);
          line-height: 1.05;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .qcTime {
          justify-self: end;
          white-space: nowrap;

          font-size: 9px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.52);
          line-height: 1.05;
        }
      `}</style>
    </>
  );
}
