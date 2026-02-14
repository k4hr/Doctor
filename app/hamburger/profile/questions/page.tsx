/* path: app/hamburger/profile/questions/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../components/TopBarBack';

// ✅ карточка как на главной
import QuestionCard, { type QuestionCardData } from '../../../vopros/main/QuestionCard';

type MyQuestionItem = {
  id: string;
  title: string;
  speciality: string;
  createdAt: string; // ISO
  isClosed: boolean;

  // опционально (если потом добавишь в /api/question/my)
  isFree?: boolean | null;
  priceRub?: number | null;
  answersCount?: number | null;
};

type ApiOk = { ok: true; items: MyQuestionItem[] };
type ApiErr = { ok: false; error: string; hint?: string };
type ApiResp = ApiOk | ApiErr;

function tg(): any | null {
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

function answersSuffix(cnt: number) {
  const n = Math.max(0, Math.trunc(cnt));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return '';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'а';
  return 'ов';
}

function toQuestionCardData(q: MyQuestionItem): QuestionCardData {
  const cnt = typeof q.answersCount === 'number' && Number.isFinite(q.answersCount) ? Math.max(0, q.answersCount) : 0;

  const isFree = q.isFree === true;
  const price = typeof q.priceRub === 'number' && Number.isFinite(q.priceRub) ? Math.max(0, q.priceRub) : 0;

  const status: QuestionCardData['status'] = q.isClosed ? 'CLOSED' : cnt > 0 ? 'ANSWERING' : 'WAITING';

  const priceBadge: QuestionCardData['priceBadge'] = isFree ? 'FREE' : 'PAID';

  const priceText = isFree ? 'Бесплатно' : price > 0 ? `${Math.round(price)} ₽` : 'Платно';

  return {
    id: q.id,

    title: String(q.title || '').trim() || '—',
    bodySnippet: '',
    createdAt: q.createdAt,

    // снизу слева как на главной
    doctorLabel: String(q.speciality || '').trim() || '—',

    // верхняя строка маленьким (в QuestionCard это authorLabel)
    authorLabel: q.isClosed
      ? 'Архив'
      : cnt > 0
      ? `${cnt} ответ${answersSuffix(cnt)}`
      : 'Ждёт ответа',

    status,
    answersCount: cnt,

    priceText,
    priceBadge,
  };
}

export default function HamburgerQuestionsPage() {
  const router = useRouter();

  const [tab, setTab] = useState<'ACTIVE' | 'ARCHIVE'>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');
  const [items, setItems] = useState<MyQuestionItem[]>([]);

  useEffect(() => {
    try {
      tg()?.ready?.();
      tg()?.expand?.();
    } catch {}

    (async () => {
      try {
        setLoading(true);
        setWarn('');

        const res = await fetch('/api/question/my', { method: 'GET', cache: 'no-store' });
        const j = (await res.json().catch(() => null)) as ApiResp | null;

        if (!res.ok || !j || (j as any).ok !== true) {
          setWarn(String((j as any)?.hint || (j as any)?.error || 'Не удалось загрузить вопросы'));
          setItems([]);
          return;
        }

        setItems(Array.isArray((j as ApiOk).items) ? (j as ApiOk).items : []);
      } catch (e) {
        console.error(e);
        setWarn('Ошибка загрузки списка вопросов');
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const wantClosed = tab === 'ARCHIVE';
    return items.filter((q) => (wantClosed ? !!q.isClosed : !q.isClosed));
  }, [items, tab]);

  const cards = useMemo(() => filtered.map(toQuestionCardData), [filtered]);

  // клики в QuestionCard ведут на /vopros/:id — это нам и надо
  // поэтому goQuestion уже не нужен

  return (
    <main className="p">
      <TopBarBack />

      <h1 className="t">Мои вопросы</h1>
      <p className="s">Здесь находятся актуальные вопросы и архив</p>

      <div className="seg" role="tablist" aria-label="Переключатель списка вопросов">
        <button
          type="button"
          className={'segBtn ' + (tab === 'ACTIVE' ? 'segBtn--on' : '')}
          onClick={() => {
            haptic('light');
            setTab('ACTIVE');
          }}
          role="tab"
          aria-selected={tab === 'ACTIVE'}
        >
          Активные
        </button>

        <button
          type="button"
          className={'segBtn ' + (tab === 'ARCHIVE' ? 'segBtn--on' : '')}
          onClick={() => {
            haptic('light');
            setTab('ARCHIVE');
          }}
          role="tab"
          aria-selected={tab === 'ARCHIVE'}
        >
          Архив
        </button>
      </div>

      {warn ? <div className="warn">{warn}</div> : null}

      {loading ? (
        <div className="muted">Загрузка…</div>
      ) : cards.length === 0 ? (
        <div className="muted">{tab === 'ACTIVE' ? 'Активных вопросов пока нет.' : 'В архиве пока пусто.'}</div>
      ) : (
        <section className="cards" aria-label="Список вопросов">
          {cards.map((q) => (
            <QuestionCard key={q.id} q={q} hrefBase="/vopros" />
          ))}
        </section>
      )}

      <style jsx>{`
        .p {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          background: #f6f7fb;
        }

        .t {
          margin: 6px 0 0;
          font-size: 34px;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #111827;
        }

        .s {
          margin: 8px 0 14px;
          font-size: 16px;
          font-weight: 600;
          color: rgba(17, 24, 39, 0.58);
        }

        .seg {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 6px 0 14px;
        }

        .segBtn {
          border-radius: 18px;
          padding: 12px 14px;
          border: 1px solid rgba(15, 23, 42, 0.14);
          background: rgba(255, 255, 255, 0.92);
          color: rgba(17, 24, 39, 0.72);
          font-weight: 900;
          font-size: 18px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.05);
        }

        .segBtn--on {
          border-color: rgba(36, 199, 104, 0.45);
          background: rgba(36, 199, 104, 0.12);
          color: rgba(22, 163, 74, 1);
          box-shadow: 0 10px 22px rgba(36, 199, 104, 0.14);
        }

        .segBtn:active {
          transform: scale(0.99);
        }

        .warn {
          margin: 0 0 12px;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
          font-weight: 900;
        }

        .muted {
          font-size: 12px;
          color: rgba(15, 23, 42, 0.6);
          padding: 8px 0;
          font-weight: 800;
        }

        .cards {
          display: flex;
          flex-direction: column;
          gap: 10px; /* как на главной */
          margin-top: 8px;
        }
      `}</style>
    </main>
  );
}
