'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../../../components/TopBarBack';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

/* cookie helpers */
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

type AnswerItem = {
  id: string;
  questionId: string;
  createdAt: string;
  body: string;
  questionTitle: string | null;
  questionSpeciality: string | null;
};
type AnswersOk = { ok: true; doctorId: string; items: AnswerItem[] };
type AnswersErr = { ok: false; error: string; hint?: string };
type AnswersResp = AnswersOk | AnswersErr;

function fmtDateTimeRu(iso: string) {
  try {
    const d = new Date(iso);
    const ts = d.getTime();
    if (!Number.isFinite(ts)) return '—';
    const date = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
    const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
    return `${date} · ${time}`;
  } catch {
    return '—';
  }
}

export default function DoctorQuestionsPage() {
  const router = useRouter();

  const [initData, setInitData] = useState('');
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');

  const [items, setItems] = useState<AnswerItem[]>([]);
  const titleSub = useMemo(() => (loading ? 'Загрузка…' : 'Актуальные и архив'), [loading]);

  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try {
      WebApp?.ready?.();
    } catch {}

    const idata = (WebApp?.initData as string) || getInitDataFromCookie();
    if (WebApp?.initData && typeof WebApp.initData === 'string' && WebApp.initData.length > 0) {
      setCookie('tg_init_data', WebApp.initData, 3);
    }
    setInitData(idata || '');

    (async () => {
      try {
        setLoading(true);
        setWarn('');

        if (!idata) {
          setWarn('Нет initData от Telegram. Открой из бота.');
          router.replace('/hamburger/profile');
          return;
        }

        const r = await fetch('/api/doctor/answers?limit=200', {
          method: 'GET',
          headers: { 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
          cache: 'no-store',
        });

        const j = (await r.json().catch(() => null)) as AnswersResp | null;

        if (!r.ok || !j || (j as any).ok !== true) {
          setWarn((j as any)?.hint || (j as any)?.error || 'Не удалось загрузить вопросы');
          setItems([]);
          return;
        }

        setItems((j as AnswersOk).items || []);
      } catch (e) {
        console.error(e);
        setWarn('Ошибка сети/сервера при загрузке вопросов');
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function refresh() {
    haptic('light');
    if (!initData) return;
    try {
      setLoading(true);
      setWarn('');

      const r = await fetch('/api/doctor/answers?limit=200', {
        method: 'GET',
        headers: { 'X-Telegram-Init-Data': initData, 'X-Init-Data': initData },
        cache: 'no-store',
      });

      const j = (await r.json().catch(() => null)) as AnswersResp | null;

      if (!r.ok || !j || (j as any).ok !== true) {
        setWarn((j as any)?.hint || (j as any)?.error || 'Не удалось обновить');
        return;
      }

      setItems((j as AnswersOk).items || []);
    } catch (e) {
      console.error(e);
      setWarn('Ошибка обновления');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <TopBarBack />

      <div className="wrap">
        <div className="head">
          <div>
            <div className="title">Вопросы</div>
            <div className="sub">{titleSub}</div>
          </div>
          <button type="button" className="linkBtn" onClick={refresh} disabled={loading}>
            Обновить
          </button>
        </div>

        {warn ? <div className="warn">{warn}</div> : null}
        {loading ? <div className="muted">Загрузка…</div> : null}
        {!loading && items.length === 0 ? <div className="muted">Пока ничего нет.</div> : null}

        <div className="list">
          {items.map((a) => (
            <button
              key={a.id}
              type="button"
              className="item"
              onClick={() => {
                haptic('light');
                router.push(`/vopros/${encodeURIComponent(a.questionId)}`);
              }}
            >
              <div className="top">
                <div className="t">{a.questionTitle || 'Вопрос'}</div>
                <div className="d">{fmtDateTimeRu(a.createdAt)}</div>
              </div>
              <div className="m">{a.questionSpeciality || '—'}</div>
              <div className="b">{a.body || ''}</div>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          background: #f6f7fb;
        }
        .wrap {
          max-width: 430px;
          margin: 0 auto;
        }
        .head {
          margin-top: 6px;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
        }
        .title {
          font-size: 22px;
          font-weight: 950;
          color: #111827;
        }
        .sub {
          margin-top: 4px;
          font-size: 13px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.6);
        }
        .linkBtn {
          border: none;
          background: transparent;
          color: #6d28d9;
          font-weight: 950;
          font-size: 13px;
          text-decoration: underline;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .linkBtn:disabled {
          opacity: 0.6;
          cursor: default;
          text-decoration: none;
        }
        .warn {
          margin-top: 10px;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
          font-weight: 800;
        }
        .muted {
          margin-top: 10px;
          font-size: 13px;
          color: rgba(17, 24, 39, 0.55);
          font-weight: 800;
        }
        .list {
          margin-top: 12px;
          display: grid;
          gap: 10px;
        }
        .item {
          text-align: left;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #fff;
          border-radius: 16px;
          padding: 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.04);
        }
        .item:active {
          transform: scale(0.99);
          opacity: 0.96;
        }
        .top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: baseline;
        }
        .t {
          font-size: 13px;
          font-weight: 950;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }
        .d {
          font-size: 11px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.45);
          white-space: nowrap;
        }
        .m {
          margin-top: 6px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.6);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .b {
          margin-top: 8px;
          font-size: 13px;
          line-height: 1.45;
          color: rgba(17, 24, 39, 0.78);
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
          max-height: 4.4em;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}
