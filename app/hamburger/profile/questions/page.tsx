/* path: app/hamburger/profile/questions/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../components/TopBarBack';

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

function clip(s: any, n: number) {
  const t = String(s ?? '').trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1).trimEnd() + '…';
}

function timeAgoRu(input: string) {
  const d = new Date(input);
  const ts = d.getTime();
  if (!Number.isFinite(ts)) return '—';

  const diff = Date.now() - ts;
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) return 'только что';

  const min = Math.floor(sec / 60);
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
  if (mod10 === 1 && mod100 !== 11) return '';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'а';
  return 'ов';
}

function priceLabel(q: MyQuestionItem) {
  const isFree = q.isFree === true;
  const price = typeof q.priceRub === 'number' ? q.priceRub : null;

  if (isFree) return { text: 'Бесплатно', tone: 'free' as const };
  if (price && Number.isFinite(price) && price > 0) return { text: `${Math.round(price)} ₽`, tone: 'paid' as const };

  return null;
}

function statusLabel(q: MyQuestionItem) {
  if (q.isClosed) return { text: 'Вопрос закрыт', tone: 'green' as const };

  const cnt = typeof q.answersCount === 'number' && Number.isFinite(q.answersCount) ? Math.max(0, q.answersCount) : 0;
  if (cnt > 0) return { text: `${cnt} ответ${answersSuffix(cnt)}`, tone: 'blue' as const };

  return { text: 'Ждёт ответа', tone: 'gray' as const };
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

  const goQuestion = (id: string) => {
    haptic('light');
    router.push(`/vopros/${encodeURIComponent(id)}`);
  };

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
        <div className="card">
          <div className="muted">Загрузка…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="muted">{tab === 'ACTIVE' ? 'Активных вопросов пока нет.' : 'В архиве пока пусто.'}</div>
        </div>
      ) : (
        <div className="list" aria-label="Список вопросов">
          {filtered.map((q) => {
            const pr = priceLabel(q);
            const st = statusLabel(q);

            return (
              <button key={q.id} type="button" className="qc" onClick={() => goQuestion(q.id)}>
                <div className="top">
                  <div className="title" title={String(q.title || '')}>
                    {clip(q.title, 56)}
                  </div>

                  <div className="pills">
                    {pr ? (
                      <span className={'pill ' + (pr.tone === 'paid' ? 'pill--paid' : 'pill--free')}>{pr.text}</span>
                    ) : null}

                    <span
                      className={
                        'pill ' +
                        (st.tone === 'green'
                          ? 'pill--green'
                          : st.tone === 'blue'
                          ? 'pill--blue'
                          : 'pill--gray')
                      }
                    >
                      {st.text}
                    </span>
                  </div>
                </div>

                <div className="bottom">
                  <div className="spec" title={String(q.speciality || '')}>
                    {q.speciality || '—'}
                  </div>
                  <div className="time">{timeAgoRu(q.createdAt)}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .p {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        /* Заголовки как на скрине */
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

        /* Сегмент-переключатель как на скрине */
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

        .card {
          border-radius: 18px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.92);
          padding: 14px;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
        }
        .muted {
          font-weight: 800;
          color: rgba(15, 23, 42, 0.65);
          font-size: 13px;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Карточка — максимально близко к скрину */
        .qc {
          width: 100%;
          text-align: left;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;

          border: 1px solid rgba(10, 12, 20, 0.08);
          background: rgba(255, 255, 255, 0.96);
          border-radius: 22px;

          padding: 16px;

          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.07);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);

          display: flex;
          flex-direction: column;
          gap: 14px;

          overflow: hidden;
        }
        .qc:active {
          transform: translateY(1px);
          box-shadow: 0 6px 18px rgba(18, 28, 45, 0.11);
        }

        .top {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: start;
          gap: 12px;
          min-width: 0;
        }

        /* ✅ ВОТ ТУТ: размер и цвет заголовка как на скрине */
        .title {
          margin: 0;
          font-size: 26px;
          font-weight: 950;
          color: #0b4b3a; /* вытащено с твоего скрина (тёмно-зелёный) */
          letter-spacing: -0.02em;
          line-height: 1.06;

          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-width: 0;
        }

        .pills {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          flex: 0 0 auto;
        }

        .pill {
          font-size: 16px;
          font-weight: 900;
          padding: 10px 16px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          white-space: nowrap;
          line-height: 1;
        }

        .pill--free {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.1);
          color: rgba(15, 23, 42, 0.66);
        }
        .pill--paid {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.28);
          color: #92400e;
        }

        .pill--green {
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.26);
          color: #2a9a53; /* ближе к зелёному текста на скрине */
        }
        .pill--blue {
          background: rgba(59, 130, 246, 0.12);
          border-color: rgba(59, 130, 246, 0.28);
          color: #2563eb;
        }
        .pill--gray {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.12);
          color: rgba(15, 23, 42, 0.66);
        }

        .bottom {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: end;
          gap: 12px;
          min-width: 0;
        }

        .spec {
          font-size: 18px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.62);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .time {
          font-size: 18px;
          font-weight: 900;
          color: rgba(15, 23, 42, 0.5);
          white-space: nowrap;
        }
      `}</style>
    </main>
  );
}
