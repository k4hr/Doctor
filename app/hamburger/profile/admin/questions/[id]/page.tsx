/* path: app/hamburger/profile/admin/questions/[id]/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopBarBack from '../../../../../../components/TopBarBack';
import PhotoLightbox from '../../../../../vopros/[id]/PhotoLightbox';

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
  createdAt: string;
  updatedAt?: string;
  status: string;
  speciality: string;
  title: string;
  body: string;
  keywords: string[];
  authorTelegramId: string;
  authorUsername: string | null;
  authorFirstName: string | null;
  authorLastName: string | null;
  assignedDoctorId?: string | null;
  answeredByDoctorId?: string | null;
  photoUrls: string[];
};

type GetOk = { ok: true; item: AdminQuestion };
type GetErr = { ok: false; error: string; hint?: string };
type GetResp = GetOk | GetErr;

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

export default function AdminQuestionIdPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params?.id || '').trim();

  const [item, setItem] = useState<AdminQuestion | null>(null);
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
        setItem(null);
        return;
      }

      const res = await fetch('/api/admin/questions/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData,
          'X-Init-Data': initData,
        },
        body: JSON.stringify({ id }),
        cache: 'no-store',
      });

      const j = (await res.json().catch(() => null)) as GetResp | null;

      if (!res.ok || !j || j.ok !== true) {
        setWarn((j as any)?.hint || (j as any)?.error || 'Ошибка загрузки');
        setItem(null);
        return;
      }

      setItem(j.item);
    } catch {
      setWarn('Сеть/сервер недоступны');
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const remove = async () => {
    if (!initData || !id) return;

    const ok = window.confirm('Удалить вопрос? Он исчезнет из общего списка.');
    if (!ok) return;

    haptic('medium');

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
        haptic('light');
        return;
      }

      router.replace('/hamburger/profile/admin/questions');
    } catch {
      setWarn('Ошибка сети при удалении');
      haptic('light');
    }
  };

  return (
    <main className="page">
      <TopBarBack />

      <div className="head">
        <h1 className="title">Вопрос</h1>
        <div className="actions">
          <button
            className="btn btnGhost"
            type="button"
            onClick={() => {
              haptic('light');
              router.push(`/vopros/${encodeURIComponent(id)}`);
            }}
          >
            Открыть публично
          </button>
          <button className="btn danger" type="button" onClick={remove}>
            Удалить
          </button>
        </div>
      </div>

      {warn ? <div className="warn">{warn}</div> : null}

      {loading ? (
        <div className="muted">Загрузка…</div>
      ) : !item ? (
        <div className="muted">Не найдено</div>
      ) : (
        <section className="card">
          <div className="top">
            <div className="ttl">{item.title}</div>
            <span className="pill">{item.status}</span>
          </div>

          <div className="metaRow">
            <span className="tag">{item.speciality}</span>
            <span className="meta">{fmtDateTimeRuMsk(item.createdAt)}</span>
          </div>

          <div className="metaBlock">
            <div className="meta">Автор: <b>{authorName(item)}</b></div>
            <div className="meta">Telegram ID: <span className="mono">{item.authorTelegramId}</span></div>
            <div className="meta">ID вопроса: <span className="mono">{item.id}</span></div>
            {item.assignedDoctorId ? (
              <div className="meta">Назначен врачу: <span className="mono">{item.assignedDoctorId}</span></div>
            ) : null}
            {item.answeredByDoctorId ? (
              <div className="meta">Ответил врач: <span className="mono">{item.answeredByDoctorId}</span></div>
            ) : null}
          </div>

          <div className="body">{item.body}</div>

          {Array.isArray(item.keywords) && item.keywords.length ? (
            <div className="kw">
              {item.keywords.slice(0, 30).map((k) => (
                <span key={k} className="kwPill">{k}</span>
              ))}
            </div>
          ) : null}

          <hr className="hr" />

          <div>
            <div className="photosTitle">Фотографии</div>
            {item.photoUrls.length ? <PhotoLightbox urls={item.photoUrls} /> : <div className="mutedSmall">Фото нет</div>}
          </div>
        </section>
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
          border-radius: 999px;
          padding: 10px 12px;
          font-weight: 900;
          font-size: 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .btnGhost {
          background: rgba(17,24,39,0.08);
          color: #111827;
        }

        .danger {
          background: rgba(239, 68, 68, 0.12);
          color: #b91c1c;
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

        .card {
          margin-top: 14px;
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

        .top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }

        .ttl {
          font-size: 18px;
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

        .metaRow {
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
          line-height: 1.35;
        }

        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          font-size: 11px;
        }

        .metaBlock {
          display: grid;
          gap: 4px;
        }

        .body {
          font-size: 14px;
          line-height: 1.5;
          color: rgba(11, 12, 16, 0.82);
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

        .hr {
          border: none;
          border-top: 1px solid rgba(15,23,42,0.08);
          margin: 6px 0;
        }

        .photosTitle {
          font-weight: 900;
          margin-bottom: 8px;
        }
      `}</style>
    </main>
  );
}
