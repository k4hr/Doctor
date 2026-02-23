/* path: app/hamburger/profile/admin/questions/page.tsx */
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../../components/TopBarBack';

// ✅ карточка как на главной / "Мои вопросы"
import QuestionCard, { type QuestionCardData } from '../../../../vopros/main/QuestionCard';

/* -------- tg helpers -------- */
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

/* -------- cookie helpers -------- */
function setCookie(name: string, value: string, days = 3) {
  try {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  } catch {}
}

function getCookie(name: string): string {
  try {
    const rows = document.cookie ? document.cookie.split('; ') : [];
    for (const row of rows) {
      const [k, ...rest] = row.split('=');
      if (decodeURIComponent(k) === name) return decodeURIComponent(rest.join('='));
    }
  } catch {}
  return '';
}

function getInitDataFromCookie(): string {
  return getCookie('tg_init_data');
}
/* -------------------------------- */

type AdminQuestion = {
  id: string;
  createdAt: string; // ISO
  status: string; // OPEN | IN_PROGRESS | DONE (или старые)
  speciality: string;
  title: string;
  body: string;
  keywords: string[];
  authorTelegramId: string;
  authorUsername: string | null;
  authorFirstName: string | null;
  authorLastName: string | null;

  // ✅ отдаём из API
  isFree?: boolean | null;
  priceRub?: number | null;
  answersCount?: number | null;

  // опционально, но пусть будет
  photoUrls?: string[] | null;
};

type ListOk = { ok: true; items: AdminQuestion[] };
type ListErr = { ok: false; error: string; hint?: string };
type ListResp = ListOk | ListErr;

function fmtDateTimeRuMsk(input: string) {
  const d = new Date(input);
  const ts = d.getTime();
  if (!Number.isFinite(ts)) return '—';

  const datePart = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);

  const timePart = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d);

  return `${datePart} ${timePart} (МСК)`;
}

function authorName(q: AdminQuestion) {
  const first = (q.authorFirstName || '').trim();
  const last = (q.authorLastName || '').trim();
  const u = (q.authorUsername || '').trim();
  if (first || last) return [first, last].filter(Boolean).join(' ');
  if (u) return `@${u}`;
  return `tg:${q.authorTelegramId}`;
}

function answersSuffix(cnt: number) {
  const n = Math.max(0, Math.trunc(cnt));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return '';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'а';
  return 'ов';
}

function mapStatusToUI(s: string): 'WAITING' | 'ANSWERING' | 'CLOSED' {
  const v = String(s || '').toUpperCase();
  if (v === 'DONE') return 'CLOSED';
  if (v === 'IN_PROGRESS') return 'ANSWERING';
  if (v === 'OPEN') return 'WAITING';

  if (v === 'CLOSED') return 'CLOSED';
  if (v === 'ANSWERING') return 'ANSWERING';
  if (v === 'WAITING') return 'WAITING';

  return 'WAITING';
}

function toQuestionCardData(q: AdminQuestion): QuestionCardData {
  const cnt = typeof q.answersCount === 'number' && Number.isFinite(q.answersCount) ? Math.max(0, q.answersCount) : 0;

  const price = typeof q.priceRub === 'number' && Number.isFinite(q.priceRub) ? Math.max(0, q.priceRub) : 0;

  // ✅ если есть цена > 0 — точно платный, даже если isFree вдруг не пришёл
  const isPaid = price > 0 || q.isFree === false;
  const isFree = !isPaid;

  const status = mapStatusToUI(q.status);

  const priceBadge: QuestionCardData['priceBadge'] = isPaid ? 'PAID' : 'FREE';
  const priceText = isFree ? 'Бесплатно' : `${Math.round(price || 0)} ₽`;

  const author = authorName(q);
  const created = fmtDateTimeRuMsk(q.createdAt);

  const authorLabel =
    status === 'CLOSED'
      ? `Закрыт · ${author}`
      : cnt > 0
      ? `${cnt} ответ${answersSuffix(cnt)} · ${author}`
      : `Ждёт ответа · ${author}`;

  return {
    id: q.id,
    title: String(q.title || '').trim() || '—',
    bodySnippet: '',
    createdAt: q.createdAt,

    doctorLabel: String(q.speciality || '').trim() || '—',
    authorLabel: `${authorLabel} · ${created}`,

    status,
    answersCount: cnt,

    priceText,
    priceBadge,
  };
}

export default function AdminQuestionsPage() {
  const router = useRouter();

  const [items, setItems] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');

  const [initData, setInitData] = useState<string>('');

  useEffect(() => {
    try {
      tg()?.ready?.();
      tg()?.expand?.();
    } catch {}

    try {
      const WebApp: any = tg();
      const v = (WebApp?.initData as string) || getInitDataFromCookie();
      if (WebApp?.initData) setCookie('tg_init_data', WebApp.initData, 3);
      setInitData(String(v || ''));
    } catch {
      setInitData(getInitDataFromCookie());
    }
  }, []);

  const load = async (init: string) => {
    try {
      setWarn('');
      setLoading(true);

      if (!init) {
        setWarn('Нет initData — страница недоступна.');
        setItems([]);
        return;
      }

      const res = await fetch('/api/admin/questions/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': init,
          'X-Init-Data': init,
        },
        body: JSON.stringify({ limit: 100 }),
        cache: 'no-store',
      });

      const j = (await res.json().catch(() => null)) as ListResp | null;

      if (!res.ok || !j || (j as any).ok !== true) {
        setWarn((j as any)?.hint || (j as any)?.error || 'Ошибка загрузки');
        setItems([]);
        return;
      }

      setItems(Array.isArray((j as any).items) ? (j as any).items : []);
    } catch {
      setWarn('Сеть/сервер недоступны');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initData) load(initData);
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initData]);

  const cards = useMemo(() => items.map(toQuestionCardData), [items]);

  return (
    <main className="p">
      <TopBarBack />

      <h1 className="t">Вопросы</h1>
      <p className="s">Админский список (карточки как в ленте)</p>

      <div className="actions">
        <button
          className="btn"
          type="button"
          onClick={() => {
            haptic('light');
            load(initData);
          }}
          disabled={loading}
        >
          {loading ? 'Загрузка…' : 'Обновить'}
        </button>

        <button
          className="btn btnGhost"
          type="button"
          onClick={() => {
            haptic('light');
            router.push('/vopros');
          }}
        >
          Открыть ленту
        </button>
      </div>

      {warn ? <div className="warn">{warn}</div> : null}

      {loading ? (
        <div className="muted">Загрузка…</div>
      ) : cards.length === 0 ? (
        <div className="muted">Пока нет вопросов.</div>
      ) : (
        <section className="cards" aria-label="Список вопросов">
          {cards.map((q) => (
            <QuestionCard key={q.id} q={q} hrefBase="/hamburger/profile/admin/questions" />
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

        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin: 6px 0 14px;
        }

        .btn {
          border: 1px solid rgba(15, 23, 42, 0.14);
          background: rgba(255, 255, 255, 0.92);
          border-radius: 18px;
          padding: 12px 14px;
          font-weight: 900;
          font-size: 16px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.05);
        }

        .btnGhost {
          background: rgba(255, 255, 255, 0.6);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .warn {
          margin: 0 0 12px;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
          font-weight: 900;
          overflow-wrap: anywhere;
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
          gap: 10px;
          margin-top: 8px;
        }
      `}</style>
    </main>
  );
}
