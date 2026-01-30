/* path: app/hamburger/profile/admin/questions/page.tsx */
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
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
    second: '2-digit',
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

function short(s: string, max = 140) {
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

function statusTone(s: string): 'green' | 'yellow' | 'gray' | 'red' {
  const v = String(s || '').toUpperCase();
  if (v === 'DONE') return 'green';
  if (v === 'ANSWERING') return 'yellow';
  if (v === 'CLOSED') return 'red';
  return 'gray';
}

function toneBg(t: string) {
  if (t === 'green') return 'rgba(34,197,94,.12)';
  if (t === 'yellow') return 'rgba(245,158,11,.14)';
  if (t === 'red') return 'rgba(239,68,68,.12)';
  return 'rgba(148,163,184,.18)';
}

function toneFg(t: string) {
  if (t === 'green') return 'rgb(22,163,74)';
  if (t === 'yellow') return 'rgb(180,83,9)';
  if (t === 'red') return 'rgb(185,28,28)';
  return 'rgb(71,85,105)';
}

export default function AdminQuestionsPage() {
  const router = useRouter();

  const [items, setItems] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');

  const [initData, setInitData] = useState<string>('');

  const [lbOpen, setLbOpen] = useState(false);
  const [lbUrls, setLbUrls] = useState<string[]>([]);
  const [lbIndex, setLbIndex] = useState(0);

  const PhotoLightboxAny = PhotoLightbox as any;

  useEffect(() => {
    try {
      const WebApp: any = (window as any)?.Telegram?.WebApp;
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
    if (initData) load(initData);
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initData]);

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
    <main className="aqPage">
      <TopBarBack />

      <div className="aqWrap">
        <div className="aqHead">
          <h1 className="aqTitle">Вопросы</h1>

          <div className="aqActions">
            <button
              className="aqBtn"
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
              className="aqBtn aqBtnGhost"
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

        {warn ? <div className="aqWarn">{warn}</div> : null}

        {loading ? (
          <div className="aqMuted">Загружаем вопросы…</div>
        ) : items.length === 0 ? (
          <div className="aqMuted">Пока нет вопросов.</div>
        ) : (
          <div className="aqList">
            {items.map((q) => {
              const tone = statusTone(q.status);
              const thumb = Array.isArray(q.photoUrls) && q.photoUrls.length > 0 ? q.photoUrls[0] : '';

              return (
                <section
                  key={q.id}
                  className="aqCard"
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
                  <div className="aqCardInner">
                    <div className="aqThumb">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          className="aqThumbImg"
                          loading="lazy"
                          onClick={(e) => {
                            e.stopPropagation();
                            haptic('light');
                            openLightbox(q.photoUrls, 0);
                          }}
                        />
                      ) : (
                        <div className="aqThumbPh" aria-hidden="true">
                          ?
                        </div>
                      )}
                    </div>

                    <div className="aqMain">
                      <div className="aqLineTop">
                        <div className="aqName">{q.title || 'Без названия'}</div>

                        <div className="aqMiniBtns">
                          <button
                            type="button"
                            className="aqMiniBtn"
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
                            className="aqMiniBtn aqMiniBtnDanger"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeQuestion(q.id);
                            }}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>

                      <div className="aqSub">
                        <span
                          className="aqBadge"
                          style={{
                            background: toneBg(tone),
                            color: toneFg(tone),
                          }}
                        >
                          {statusRu(q.status)}
                        </span>

                        <span className="aqDot">•</span>
                        <span className="aqSubText">{q.speciality || '—'}</span>
                      </div>

                      <div className="aqMeta">
                        <div className="aqMetaRow">
                          <span className="aqMetaKey">Автор:</span>
                          <span className="aqMetaVal">{authorName(q)}</span>
                        </div>
                        <div className="aqMetaRow">
                          <span className="aqMetaKey">Создан:</span>
                          <span className="aqMetaVal">{fmtDateTimeRuMsk(q.createdAt)}</span>
                        </div>
                      </div>

                      {q.body ? <div className="aqPreview">{short(q.body, 160)}</div> : null}

                      {Array.isArray(q.photoUrls) && q.photoUrls.length > 1 ? (
                        <div className="aqPhotosLine">
                          <button
                            type="button"
                            className="aqPhotoMore"
                            onClick={(e) => {
                              e.stopPropagation();
                              haptic('light');
                              openLightbox(q.photoUrls, 0);
                            }}
                          >
                            Фото: {q.photoUrls.length}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <PhotoLightboxAny open={lbOpen} urls={lbUrls} startIndex={lbIndex} onClose={() => setLbOpen(false)} />

      <style jsx>{`
        .aqPage {
          min-height: 100vh;
          background: linear-gradient(180deg, rgba(241, 245, 249, 1), rgba(248, 250, 252, 1));
          overflow-x: hidden; /* ✅ убираем горизонтальный скролл */
        }

        /* ✅ как в /vopros/[id]: страница на всю ширину, без max-width */
        .aqWrap {
          width: 100%;
          padding: 14px 14px 28px;
          overflow-x: hidden;
        }

        .aqHead {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin: 10px 0 14px;
          min-width: 0;
        }

        .aqTitle {
          font-size: 28px;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin: 0;
          min-width: 0;
        }

        .aqActions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
          flex-shrink: 0;
        }

        .aqBtn {
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 14px;
          -webkit-tap-highlight-color: transparent;
        }

        .aqBtn:disabled {
          opacity: 0.6;
        }

        .aqBtnGhost {
          background: rgba(255, 255, 255, 0.6);
        }

        .aqWarn {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.18);
          color: rgb(153, 27, 27);
          padding: 10px 12px;
          border-radius: 14px;
          margin: 0 0 12px;
          font-size: 14px;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .aqMuted {
          color: rgba(71, 85, 105, 0.9);
          font-size: 14px;
          padding: 10px 2px;
        }

        .aqList {
          display: grid;
          gap: 12px;
          min-width: 0;
        }

        .aqCard {
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 18px;
          padding: 12px;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
          cursor: pointer;
          user-select: none;
          outline: none;

          width: 100%;
          max-width: 100%;
          overflow: hidden; /* ✅ всё держим внутри карточки */
        }

        .aqCard:focus {
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.14), 0 8px 18px rgba(15, 23, 42, 0.06);
        }

        .aqCardInner {
          display: grid;
          grid-template-columns: 54px 1fr;
          gap: 12px;
          align-items: start;
          min-width: 0;
        }

        .aqThumb {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(241, 245, 249, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
        }

        .aqThumbImg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          max-width: 100%;
        }

        .aqThumbPh {
          font-weight: 700;
          color: rgba(71, 85, 105, 0.9);
        }

        .aqMain {
          min-width: 0;
        }

        .aqLineTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          min-width: 0;
        }

        .aqName {
          min-width: 0;
          font-size: 16px;
          font-weight: 750;
          line-height: 1.25;
          margin: 0;
          color: rgba(15, 23, 42, 1);

          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .aqMiniBtns {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .aqMiniBtn {
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(255, 255, 255, 0.9);
          border-radius: 10px;
          padding: 6px 10px;
          font-size: 12px;
          line-height: 1;
          color: rgba(15, 23, 42, 0.9);
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
        }

        .aqMiniBtnDanger {
          border-color: rgba(239, 68, 68, 0.28);
          background: rgba(239, 68, 68, 0.08);
          color: rgb(185, 28, 28);
        }

        .aqSub {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
          flex-wrap: wrap;
          min-width: 0;
        }

        .aqBadge {
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          white-space: nowrap;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .aqDot {
          color: rgba(148, 163, 184, 1);
        }

        .aqSubText {
          color: rgba(71, 85, 105, 1);
          font-size: 13px;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .aqMeta {
          margin-top: 8px;
          display: grid;
          gap: 4px;
          min-width: 0;
        }

        .aqMetaRow {
          display: grid;
          grid-template-columns: 54px 1fr;
          gap: 8px;
          font-size: 12px;
          line-height: 1.25;
          min-width: 0;
        }

        .aqMetaKey {
          color: rgba(100, 116, 139, 1);
          white-space: nowrap;
        }

        .aqMetaVal {
          color: rgba(30, 41, 59, 0.92);
          min-width: 0;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .aqPreview {
          margin-top: 8px;
          font-size: 13px;
          line-height: 1.35;
          color: rgba(30, 41, 59, 0.86);
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .aqPhotosLine {
          margin-top: 10px;
          min-width: 0;
        }

        .aqPhotoMore {
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(241, 245, 249, 1);
          border-radius: 12px;
          padding: 7px 10px;
          font-size: 12px;
          color: rgba(15, 23, 42, 0.85);
          -webkit-tap-highlight-color: transparent;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 420px) {
          .aqTitle {
            font-size: 24px;
          }
          .aqMiniBtns {
            display: none;
          }
        }
      `}</style>

      {/* ✅ страховка на уровне документа от горизонтального скролла */}
      <style jsx global>{`
        html,
        body {
          overflow-x: hidden;
        }
        img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </main>
  );
}
