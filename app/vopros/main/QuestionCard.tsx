/* path: app/vopros/main/QuestionCard.tsx  */
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

  // WAITING = ждёт ответа
  // ANSWERING = есть ответы (кол-во показываем отдельно)
  // CLOSED = вопрос закрыт
  status: QuestionStatusUI;

  // сколько ответов (0..n). если не передашь — будет 0
  answersCount?: number;

  // если PAID и хочешь показывать цену — передай строкой, например "99 ₽" / "49 ⭐"
  // если не передашь — покажем "Платно"
  priceText?: string;

  // старое поле оставляем для совместимости
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

function statusLabel(q: QuestionCardData) {
  const st = String(q.status || 'WAITING').toUpperCase();
  const n = Number.isFinite(q.answersCount as number) ? Number(q.answersCount) : 0;

  if (st === 'CLOSED') return { text: 'Вопрос закрыт', tone: 'red' as const };

  if (st === 'ANSWERING') {
    const cnt = Math.max(0, n);
    if (cnt <= 0) return { text: 'Ждёт ответа', tone: 'gray' as const };
    return { text: `${cnt} ответ${cnt % 10 === 1 && cnt % 100 !== 11 ? '' : cnt % 10 >= 2 && cnt % 10 <= 4 && (cnt % 100 < 10 || cnt % 100 >= 20) ? 'а' : 'ов'}`, tone: 'green' as const };
  }

  return { text: 'Ждёт ответа', tone: 'gray' as const };
}

function priceLabel(q: QuestionCardData) {
  if (q.priceBadge === 'PAID') {
    return { text: (q.priceText || 'Платно').trim(), tone: 'gold' as const };
  }
  return { text: 'Бесплатно', tone: 'free' as const };
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
          <span
            className={`qcPrice ${ui.priceTone === 'gold' ? 'qcPrice--gold' : 'qcPrice--free'}`}
            aria-label={ui.priceText}
          >
            {ui.priceText}
          </span>
        </div>

        <p className="qcSnippet">{clampText(q.bodySnippet, 140)}</p>

        <div className="qcBottom">
          <div className="qcLeft">
            <span
              className={`qcStatus ${
                ui.statusTone === 'green'
                  ? 'qcStatus--green'
                  : ui.statusTone === 'red'
                  ? 'qcStatus--red'
                  : 'qcStatus--gray'
              }`}
            >
              {ui.statusText}
            </span>

            <span className="qcDoctor">{q.doctorLabel}</span>
          </div>

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
          background: rgba(255, 255, 255, 0.94);
          border-radius: 18px;

          padding: 14px 14px 12px;

          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);

          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: 8px;

          /* ВАЖНО: фиксированная высота карточек */
          height: 168px;
          overflow: hidden;
        }

        .qc:active {
          transform: translateY(1px);
          box-shadow: 0 6px 18px rgba(18, 28, 45, 0.12);
        }

        .qcTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          min-height: 42px; /* чтобы заголовок + цена держали верх */
        }

        .qcTitle {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
          color: #0b0c10;
          letter-spacing: -0.01em;
          line-height: 1.15;

          /* 2 строки максимум */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .qcPrice {
          flex: 0 0 auto;
          font-size: 12px;
          font-weight: 900;
          padding: 7px 12px;
          border-radius: 999px;
          border: 1px solid transparent;
          white-space: nowrap;
          margin-top: 2px;
        }

        .qcPrice--free {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.10);
          color: rgba(15, 23, 42, 0.70);
        }

        .qcPrice--gold {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.30);
          color: #92400e;
        }

        .qcSnippet {
          margin: 0;
          font-size: 14px;
          line-height: 1.45;
          color: rgba(11, 12, 16, 0.75);

          /* держим одинаковую высоту текста */
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .qcBottom {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: end;
          gap: 10px;
          min-height: 44px; /* чтобы низ всегда был “на месте” */
        }

        .qcLeft {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
          min-width: 0;
        }

        .qcStatus {
          font-size: 12px;
          font-weight: 800;
          padding: 7px 12px;
          border-radius: 999px;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .qcStatus--green {
          background: rgba(36, 199, 104, 0.1);
          border-color: rgba(36, 199, 104, 0.3);
          color: #166534;
        }

        .qcStatus--gray {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.12);
          color: rgba(15, 23, 42, 0.7);
        }

        .qcStatus--red {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.26);
          color: #991b1b;
        }

        /* Плашка специальности — длина зависит от слова (как ты просил) */
        .qcDoctor {
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.04);
          border: 1px solid rgba(15, 23, 42, 0.12);
          color: rgba(15, 23, 42, 0.85);
          font-weight: 900;
          font-size: 12px;
          white-space: nowrap;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .qcTime {
          justify-self: end;
          color: rgba(15, 23, 42, 0.55);
          white-space: nowrap;
          font-weight: 800;
          font-size: 12px;
          padding-bottom: 2px;
        }
      `}</style>
    </>
  );
}
