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

function statusRu(s: string) {
  const v = String(s || '').toUpperCase();
  if (v === 'ANSWERING') return 'Отвечают';
  if (v === 'WAITING') return 'Ожидает';
  if (v === 'DONE') return 'Готово';
  if (v === 'CLOSED') return 'Закрыт';
  return s || '—';
}

export default function AdminQuestionsPage() {
  const router = useRouter();

  const [items, setItems] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');

  const [lbOpen, setLbOpen] = useState(false);
  const [lbUrls, setLbUrls] = useState<string[]>([]);
  const [lbIndex, setLbIndex] = useState(0);

  // чтобы не упереться в строгие типы неизвестного компонента
  const PhotoLightboxAny = PhotoLightbox as any;

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
    router.push(`/hamburger/profile/admin/questions/${encodeURIComponent(id)}`);
  };

  const openLightbox = (urls: string[], index: number) => {
    if (!urls || urls.length === 0) return;
    setLbUrls(urls);
    setLbIndex(Math.max(0, Math.min(index, urls.length - 1)));
    setLbOpen(true);
  };

  const removeQuestion = async (id: string) => {
    if (!initData) return;

    const ok = window.confirm('Удалить вопрос? Он исчезнет из общего списка.');
    if (!ok) return;

    haptic('medium');

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
        setItems(prev);
        haptic('light');
        return;
      }
    } catch {
      setWarn('Ошибка сети при удалении');
      setItems(prev);
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
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openQuestion(q.id);
                }
              }}
            >
              <div className="rowTop">
                <div className="meta">
                  <div className="badge">{statusRu(q.status)}</div>
                  <div className="date">{fmtDateTimeRuMsk(q.createdAt)}</div>
                </div>

                <div className="rightBtns">
                  <button
                    type="button"
                    className="btnSmall"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic('light');
                      openQuestion(q.id);
                    }}
                  >
                    Открыть
                  </button>

                  <button
                    type="button"
                    className="btnSmall btnDanger"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeQuestion(q.id);
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>

              <div className="rowMid">
                <div className="doctor">
                  <span className="muted">Кому:</span> {q.speciality || '—'}
                </div>
                <div className="author">
                  <span className="muted">Автор:</span> {authorName(q)}
                </div>
              </div>

              <h3 className="qTitle">{q.title || 'Без названия'}</h3>
              <div className="qBody">{short(q.body, 260)}</div>

              {Array.isArray(q.keywords) && q.keywords.length > 0 ? (
                <div className="tags">
                  {q.keywords.slice(0, 12).map((k, i) => (
                    <span key={`${k}-${i}`} className="tag">
                      {k}
                    </span>
                  ))}
                </div>
              ) : null}

              {Array.isArray(q.photoUrls) && q.photoUrls.length > 0 ? (
                <div className="photos" aria-label="Фотографии">
                  {q.photoUrls.slice(0, 8).map((url, i) => (
                    <button
                      key={`${url}-${i}`}
                      type="button"
                      className="photoBtn"
                      onClick={(e) => {
                        e.stopPropagation();
                        haptic('light');
                        openLightbox(q.photoUrls, i);
                      }}
                      aria-label={`Открыть фото ${i + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="photo" src={url} alt="" loading="lazy" />
                    </button>
                  ))}
                  {q.photoUrls.length > 8 ? (
                    <div className="more">+{q.photoUrls.length - 8}</div>
                  ) : null}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}

      {/* Лайтбокс (через any — чтобы не ловить TypeScript на несоответствии пропсов) */}
      <PhotoLightboxAny
        open={lbOpen}
        urls={lbUrls}
        startIndex={lbIndex}
        onClose={() => setLbOpen(false)}
      />
    </main>
  );
}
