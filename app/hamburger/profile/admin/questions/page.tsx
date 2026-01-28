/* path: app/hamburger/profile/admin/questions/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../../components/TopBarBack';
import PhotoLightbox from '../../../../vopros/[id]/PhotoLightbox';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

/* -------- cookie helpers -------- */
function setCookie(name: string, value: string, days = 3) {
  try {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
      value
    )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
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
  status: string;
  speciality: string;
  title: string;
  body: string;
  keywords: string[];
  authorTelegramId: string;
  authorUsername: string | null;
  authorFirstName: string | null;
  authorLastName: string | null;
  photoUrls: string[];
};

type ListOk = { ok: true; items: AdminQuestion[] };
type ListErr = { ok: false; error: string; hint?: string };
type ListResp = ListOk | ListErr;

type DelOk = { ok: true };
type DelErr = { ok: false; error: string; hint?: string };
type DelResp = DelOk | DelErr;

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
    hour12: false,
  }).format(d);

  return `${datePart} г., ${timePart}`;
}

function authorName(q: AdminQuestion) {
  const first = (q.authorFirstName || '').trim();
  const last = (q.authorLastName || '').trim();
  const u = (q.authorUsername || '').trim();
  if (first || last) return [first, last].filter(Boolean).join(' ');
  if (u) return `@${u}`;
  return `tg:${q.authorTelegramId}`;
}

function short(s: string, max = 220) {
  const t = String(s || '').trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
}

export default function AdminQuestionsPage() {
  const router = useRouter();

  const [items, setItems] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');

  const initData = useMemo(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    const v = (WebApp?.initData as string) || getInitDataFromCookie();
    if (WebApp?.initData) setCookie('tg_init_data', WebApp.initData, 3);
    return String(v || '');
  }, []);

  const load = async () => {
    try {
      setWarn('');
      setLoading(true);

      if (!initData) {
        setWarn('Нет initData — страница недоступна.');
        setItems([]);
        return;
      }

      const res = await fetch('/api/admin/questions/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData,
          'X-Init-Data': initData,
        },
        body: JSON.stringify({ limit: 100 }),
        cache: 'no-store',
      });

      const j = (await res.json().catch(() => null)) as ListResp | null;

      if (!res.ok || !j || j.ok !== true) {
        setWarn((j as any)?.hint || (j as any)?.error || 'Ошибка загрузки');
        setItems([]);
        return;
      }

      setItems(j.items || []);
    } catch {
      setWarn('Сеть/сервер недоступны');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openQuestion = (id: string) => {
    haptic('light');
    // Админ-деталка (её нужно сделать отдельно): /hamburger/profile/admin/questions/[id]
    router.push(`/hamburger/profile/admin/questions/${encodeURIComponent(id)}`);
  };

  const removeQuestion = async (id: string) => {
    if (!initData) return;

    const ok = window.confirm('Удалить вопрос? Он исчезнет из общего списка.');
    if (!ok) return;

    haptic('medium');

    // ✅ мгновенно убираем из UI
    const prev = items;
    setItems((x) => x.filter((q) => q.id !== id));

    try {
      const res = await fetch('/api/admin/questions/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData,
          'X-Init-Data': initData,
        },
        body: JSON.stringify({ id }),
        cache: 'no-store',
      });

      const j = (await res.json().catch(() => null)) as DelResp | null;

      if (!res.ok || !j || j.ok !== true) {
        setWarn((j as any)?.hint || (j as any)?.error || 'Ошибка удаления');
        setItems(prev); // откат
        haptic('light');
        return;
      }
    } catch {
      setWarn('Ошибка сети при удалении');
      setItems(prev); // откат
      haptic('light');
    }
  };

  return (
    <main className="page">
      <TopBarBack />

      <div className="head">
        <h1 className="title">Вопросы</h1>

        <div className="actions">
          <button
            className="btn"
            type="button"
            onClick={() => {
              haptic('light');
              load();
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
      </div>

      {warn ? <div className="warn">{warn}</div> : null}

      {loading ? (
        <div className="muted">Загружаем вопросы…</div>
      ) : items.length === 0 ? (
        <div className="muted">Пока нет вопросов.</div>
      ) : (
        <div className="list">
          {items.map((q) => (
            <section
              key={q.id}
              className="card"
              role="button"
              tabIndex={0}
              aria-label={`Открыть вопрос: ${q.title}`}
              onClick={() => openQuestion(q.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter'
