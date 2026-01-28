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
          <button className="btn" type="button" onClick={() => { haptic('light'); load(); }} disabled={loading}>
            {loading ? 'Загрузка…' : 'Обновить'}
          </button>

          <button className="btn btnGhost" type="button" onClick={() => { haptic('light'); router.push('/vopros'); }}>
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
            <section key={q.id} className="card">
              <div className="row1">
                <div className="ttl">{q.title}</div>
                <span className="pill">{q.status}</span>
              </div>

              <div className="row2">
                <span className="tag">{q.speciality}</span>
                <span className="meta">{fmtDateTimeRuMsk(q.createdAt)}</span>
              </div>

              <div className="row3">
                <span className="meta">Автор: <b>{authorName(q)}</b></span>
                <span className="meta">ID: <span className="mono">{q.id}</span></span>
              </div>

              <div className="body">{short(q.body, 320)}</div>

              {Array.isArray(q.keywords) && q.keywords.length ? (
                <div className="kw">
                  {q.keywords.slice(0, 20).map((k) => (
                    <span key={k} className="kwPill">{k}</span>
                  ))}
                </div>
              ) : null}

              {/* ✅ Фото: открываются твоим lightbox (зум пальцами) */}
              {q.photoUrls.length ? (
                <div className="photos">
                  <div className="photosTitle">Фотографии ({q.photoUrls.length})</div>
                  <PhotoLightbox urls={q.photoUrls} />
                </div>
              ) : (
                <div className="mutedSmall">Фото нет</div>
              )}

              <div className="footer">
                <button className="danger" type="button" onClick={() => removeQuestion(q.id)}>
                  Удалить из общего списка
                </button>
              </div>
            </section>
          ))}
        </div>
      )}

      <style jsx>{`
        .page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        .head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
          margin-top: 6px;
        }

        .title {
          margin: 0;
          font-size: 24px;
          font-weight: 900;
          color: #111827;
        }

        .actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .btn {
          border: none;
          background: #111827;
          color: #fff;
          border-radius: 999px;
          padding: 10px 12px;
          font-weight: 900;
          font-size: 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .btnGhost {
          background: rgba(17,24,39,0.08);
          color: #111827;
        }

        .warn {
          margin-top: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.18);
          color: #b91c1c;
          font-weight: 800;
          font-size: 12px;
          line-height: 1.35;
        }

        .muted {
          margin-top: 14px;
          color: rgba(17,24,39,0.60);
          font-weight: 700;
        }

        .mutedSmall {
          margin-top: 8px;
          color: rgba(17,24,39,0.55);
          font-weight: 700;
          font-size: 12px;
        }

        .list {
          margin-top: 14px;
          display: grid;
          gap: 12px;
        }

        .card {
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: grid;
          gap: 10px;
        }

        .row1 {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }

        .ttl {
          font-size: 16px;
          font-weight: 900;
          color: #0b0c10;
          line-height: 1.2;
        }

        .pill {
          font-size: 12px;
          font-weight: 900;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.06);
          border: 1px solid rgba(15, 23, 42, 0.10);
          color: rgba(15, 23, 42, 0.75);
          white-space: nowrap;
        }

        .row2 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tag {
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(36, 199, 104, 0.10);
          border: 1px solid rgba(36, 199, 104, 0.18);
          color: #166534;
          font-weight: 900;
          font-size: 12px;
        }

        .meta {
          color: rgba(15, 23, 42, 0.65);
          font-weight: 700;
          font-size: 12px;
        }

        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          font-size: 11px;
        }

        .row3 {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .body {
          font-size: 13px;
          line-height: 1.45;
          color: rgba(11, 12, 16, 0.78);
          white-space: pre-wrap;
        }

        .kw {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .kwPill {
          padding: 5px 9px;
          border-radius: 999px;
          border: 1px solid rgba(15,23,42,0.10);
          background: rgba(15,23,42,0.03);
          font-size: 12px;
          font-weight: 900;
          color: rgba(15,23,42,0.70);
        }

        .photosTitle {
          font-weight: 900;
          margin-bottom: 8px;
        }

        .footer {
          margin-top: 6px;
          display: flex;
          justify-content: flex-end;
        }

        .danger {
          width: 100%;
          border: 1px solid rgba(239, 68, 68, 0.35);
          background: rgba(239, 68, 68, 0.08);
          color: #b91c1c;
          font-weight: 900;
          border-radius: 14px;
          padding: 12px 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .danger:active {
          transform: scale(0.99);
        }
      `}</style>
    </main>
  );
}
