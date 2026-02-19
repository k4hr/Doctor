/* path: app/hamburger/profile/consultations/[id]/page.tsx */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import TopBarBack from '../../../../../components/TopBarBack';

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

function tgAlert(msg: string) {
  try {
    tg()?.showAlert?.(msg);
    return;
  } catch {}
  alert(msg);
}

type Msg = {
  id: string;
  createdAt: string;
  authorType: 'USER' | 'DOCTOR';
  body: string;
};

type Detail = {
  id: string;
  status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CLOSED';
  createdAt: string;
  priceRub: number;

  paidAt: string | null;

  doctorId: string;
  doctorName: string;

  problemText: string;
  photos: string[];
  messages: Msg[];
};

type ApiOk = { ok: true; item: Detail };
type ApiErr = { ok: false; error: string; hint?: string };
type ApiResp = ApiOk | ApiErr;

function fmtTime(iso: string) {
  try {
    const d = new Date(iso);
    const ts = d.getTime();
    if (!Number.isFinite(ts)) return '';
    return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  } catch {
    return '';
  }
}

function fmtDateTime(iso: string) {
  try {
    const d = new Date(iso);
    const ts = d.getTime();
    if (!Number.isFinite(ts)) return iso;
    const date = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
    const time = fmtTime(iso);
    return `${date} ${time}`;
  } catch {
    return iso;
  }
}

export default function PatientConsultationChatPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || '').trim();

  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');
  const [item, setItem] = useState<Detail | null>(null);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);

  const title = useMemo(() => item?.doctorName || 'Врач', [item?.doctorName]);
  const canChat = !!item && item.status === 'ACCEPTED' && !!item.paidAt;

  useEffect(() => {
    try {
      tg()?.ready?.();
      tg()?.expand?.();
    } catch {}

    if (!id) {
      setWarn('NO_ID');
      setLoading(false);
      return;
    }

    const idata = tg()?.initData || '';

    (async () => {
      try {
        setLoading(true);
        setWarn('');

        const res = await fetch(`/api/consultations/${encodeURIComponent(id)}`, {
          method: 'GET',
          headers: { 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
          cache: 'no-store',
        });

        const j = (await res.json().catch(() => null)) as ApiResp | null;
        if (!res.ok || !j || (j as any).ok !== true) {
          setWarn(String((j as any)?.hint || (j as any)?.error || 'Не удалось загрузить консультацию'));
          setItem(null);
          return;
        }

        setItem((j as ApiOk).item);
      } catch (e: any) {
        console.error(e);
        setWarn(String(e?.message || 'Ошибка загрузки'));
        setItem(null);
      } finally {
        setLoading(false);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'instant' as any, block: 'end' }), 60);
      }
    })();
  }, [id]);

  async function reload(scroll = true) {
    const idata = tg()?.initData || '';
    try {
      setWarn('');
      const res = await fetch(`/api/consultations/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: { 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
        cache: 'no-store',
      });
      const j = (await res.json().catch(() => null)) as ApiResp | null;
      if (!res.ok || !j || (j as any).ok !== true) {
        setWarn(String((j as any)?.hint || (j as any)?.error || 'Не удалось обновить'));
        return;
      }
      setItem((j as ApiOk).item);
      if (scroll) setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 60);
    } catch (e: any) {
      setWarn(String(e?.message || 'Сеть/сервер недоступны'));
    }
  }

  async function markPaidMock() {
    if (!item) return;
    haptic('medium');

    if (item.status !== 'ACCEPTED') {
      tgAlert('Сначала врач должен принять консультацию.');
      return;
    }
    if (item.paidAt) {
      tgAlert('Уже оплачено.');
      return;
    }

    setPaying(true);
    setWarn('');

    const idata = tg()?.initData || '';
    try {
      const res = await fetch('/api/consultation/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
        cache: 'no-store',
        body: JSON.stringify({ consultationId: item.id }),
      });

      const j = await res.json().catch(() => null);
      if (!res.ok || !j || j.ok !== true) {
        tgAlert(String(j?.hint || j?.error || 'Не удалось отметить оплату'));
        return;
      }

      await reload();
      tgAlert('Оплата отмечена (мок). Чат открыт.');
    } catch (e: any) {
      tgAlert(String(e?.message || 'Сеть/сервер недоступны'));
    } finally {
      setPaying(false);
    }
  }

  async function send() {
    if (!item) return;

    if (!canChat) {
      if (item.status === 'PENDING') tgAlert('Ждём решения врача.');
      else if (item.status === 'DECLINED') tgAlert('Врач отказал в консультации.');
      else if (item.status === 'ACCEPTED' && !item.paidAt) tgAlert('Сначала оплатите консультацию.');
      else tgAlert('Чат сейчас недоступен.');
      return;
    }

    const body = String(text || '').trim();
    if (!body) return;

    setSending(true);
    setWarn('');

    const idata = tg()?.initData || '';
    try {
      const res = await fetch(`/api/consultations/${encodeURIComponent(id)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
        cache: 'no-store',
        body: JSON.stringify({ body }),
      });

      const j = await res.json().catch(() => null);
      if (!res.ok || !j || j.ok !== true) {
        tgAlert(String(j?.hint || j?.error || 'Не удалось отправить'));
        return;
      }

      setText('');
      await reload();
    } catch (e: any) {
      tgAlert(String(e?.message || 'Сеть/сервер недоступны'));
    } finally {
      setSending(false);
    }
  }

  const statusText =
    item?.status === 'PENDING'
      ? 'Ожидает решения'
      : item?.status === 'ACCEPTED'
      ? 'Принята'
      : item?.status === 'DECLINED'
      ? 'Отклонена'
      : item?.status === 'CLOSED'
      ? 'Закрыта'
      : 'Черновик';

  return (
    <main className="p">
      <header className="top">
        <TopBarBack />
        <div className="head">
          <div className="title">{title}</div>
          <div className="sub">{item ? `Консультация • ${fmtDateTime(item.createdAt)}` : 'загрузка…'}</div>
        </div>
      </header>

      {warn ? <div className="warn">{warn}</div> : null}

      {loading ? (
        <section className="card">
          <div className="muted">Загрузка…</div>
        </section>
      ) : !item ? (
        <section className="card">
          <div className="muted">Не найдено.</div>
        </section>
      ) : (
        <div className="stack">
          <section className="card">
            <div className="rows">
              <div className="row">
                <div className="lbl">Статус</div>
                <div className="val">{statusText}</div>
              </div>

              <div className="row">
                <div className="lbl">Цена</div>
                <div className="val">{Math.round(item.priceRub || 0)} ₽</div>
              </div>

              <div className="row">
                <div className="lbl">Оплата</div>
                <div className="val">{item.paidAt ? 'Оплачено' : 'Не оплачено'}</div>
              </div>
            </div>

            <div className="hr" />

            <div className="lbl2">Ваше сообщение</div>
            <div className="body">{item.problemText}</div>

            {item.photos?.length ? (
              <>
                <div className="lbl2" style={{ marginTop: 10 }}>
                  Фото
                </div>
                <div className="photos">
                  {item.photos.map((u, i) => (
                    <a key={u + i} className="ph" href={u} target="_blank" rel="noreferrer">
                      <img src={u} alt={`photo-${i + 1}`} />
                    </a>
                  ))}
                </div>
              </>
            ) : null}

            {item.status === 'ACCEPTED' && !item.paidAt ? (
              <button className="payBtn" type="button" onClick={markPaidMock} disabled={paying}>
                {paying ? 'Оплачиваем…' : 'Оплатить (мок)'}
              </button>
            ) : null}

            {item.status === 'PENDING' ? <div className="hint">Ждём, пока врач примет или отклонит консультацию.</div> : null}
            {item.status === 'DECLINED' ? <div className="hint red">Врач отклонил консультацию.</div> : null}
            {item.status === 'ACCEPTED' && item.paidAt ? <div className="hint green">Оплачено. Чат открыт.</div> : null}
          </section>

          <section className="chat">
            <div className="msgs" aria-label="Сообщения">
              {item.messages.length === 0 ? (
                <div className="empty">Пока сообщений нет.</div>
              ) : (
                item.messages.map((m) => (
                  <div key={m.id} className={'msg ' + (m.authorType === 'USER' ? 'me' : 'you')}>
                    <div className="bubble">
                      <div className="txt">{m.body}</div>
                      <div className="tm">{fmtTime(m.createdAt)}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={endRef} />
            </div>

            <div className="composer">
              <input
                className="inp"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  canChat ? 'Написать сообщение…' : item.status === 'ACCEPTED' ? 'Оплатите, чтобы писать' : 'Ждём решения врача'
                }
                disabled={!canChat || sending}
              />
              <button className="send" type="button" onClick={send} disabled={!canChat || sending || !text.trim()}>
                Отправить
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ГЛОБАЛЬНЫЙ АНТИ-OVERFLOW (самый важный фикс для Telegram iOS) */}
      <style jsx global>{`
        html,
        body {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }
      `}</style>

      <style jsx>{`
        .p {
          min-height: 100dvh;
          padding: 12px 12px calc(env(safe-area-inset-bottom, 0px) + 18px);
          background: #f6f7fb;

          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }

        .p :global(*) {
          box-sizing: border-box;
          max-width: 100%;
        }

        .top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          max-width: 100%;
        }

        .head {
          min-width: 0;
          flex: 1 1 auto;
        }

        .title {
          font-size: 16px;
          font-weight: 950;
          color: #111827;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sub {
          margin-top: 2px;
          font-size: 12px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.55);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .warn {
          margin: 0 0 10px;
          font-size: 12px;
          font-weight: 900;
          color: #ef4444;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 100%;
        }

        .card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 18px;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
          padding: 12px;
          max-width: 100%;
          overflow: hidden;
        }

        .muted {
          font-size: 12px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.55);
        }

        .rows {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap; /* чтобы никогда не “выталкивало” ширину */
          min-width: 0;
        }

        .lbl {
          font-size: 12px;
          font-weight: 900;
          color: rgba(15, 23, 42, 0.58);
          flex: 0 0 auto;
        }

        .val {
          font-size: 13px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.86);
          flex: 1 1 auto;
          min-width: 0;
          text-align: right;

          overflow-wrap: anywhere;
          word-break: break-word;
          white-space: normal;
        }

        .hr {
          height: 1px;
          background: rgba(15, 23, 42, 0.08);
          margin: 12px 0;
        }

        .lbl2 {
          font-size: 13px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.84);
          margin-bottom: 6px;
        }

        .body {
          font-size: 14px;
          line-height: 1.5;
          color: rgba(11, 12, 16, 0.86);
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .photos {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 6px;
        }

        .ph {
          display: block;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(15, 23, 42, 0.03);
        }

        .ph img {
          width: 100%;
          height: 110px;
          object-fit: cover;
          display: block;
        }

        .payBtn {
          margin-top: 12px;
          width: 100%;
          border: none;
          border-radius: 16px;
          padding: 12px 12px;
          font-size: 14px;
          font-weight: 950;
          color: #fff;
          cursor: pointer;
          background: #24c768;
          box-shadow: 0 10px 20px rgba(36, 199, 104, 0.28);
          -webkit-tap-highlight-color: transparent;
        }
        .payBtn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }

        .hint {
          margin-top: 10px;
          padding: 10px;
          border-radius: 14px;
          border: 1px solid rgba(59, 130, 246, 0.22);
          background: rgba(59, 130, 246, 0.08);
          color: rgba(17, 24, 39, 0.78);
          font-size: 12px;
          font-weight: 800;
          line-height: 1.35;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .hint.green {
          border-color: rgba(16, 185, 129, 0.25);
          background: rgba(16, 185, 129, 0.1);
        }
        .hint.red {
          border-color: rgba(239, 68, 68, 0.25);
          background: rgba(239, 68, 68, 0.08);
        }

        .chat {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 18px;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
          overflow: hidden;

          display: flex;
          flex-direction: column;
          min-height: 320px;
          max-width: 100%;
        }

        .msgs {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;

          overflow-y: auto;
          overflow-x: hidden;

          min-height: 0;
          flex: 1 1 auto;
          -webkit-overflow-scrolling: touch;
        }

        .empty {
          font-size: 12px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.55);
        }

        .msg {
          display: flex;
          max-width: 100%;
        }
        .msg.me {
          justify-content: flex-end;
        }
        .msg.you {
          justify-content: flex-start;
        }

        .bubble {
          max-width: 78%;
          border-radius: 16px;
          padding: 10px 10px 8px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(15, 23, 42, 0.03);
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .msg.me .bubble {
          background: rgba(36, 199, 104, 0.12);
          border-color: rgba(36, 199, 104, 0.25);
        }

        .txt {
          font-size: 14px;
          line-height: 1.45;
          color: rgba(11, 12, 16, 0.86);
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .tm {
          margin-top: 4px;
          font-size: 11px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.45);
          text-align: right;
        }

        .composer {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          padding: 10px;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.9);
          max-width: 100%;
        }

        .inp {
          height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(249, 250, 251, 0.9);
          padding: 0 12px;
          font-size: 14px;
          font-weight: 800;
          color: #111827;
          outline: none;
          min-width: 0;
        }

        .send {
          height: 42px;
          border-radius: 14px;
          border: none;
          padding: 0 14px;
          font-size: 14px;
          font-weight: 950;
          cursor: pointer;
          background: #24c768;
          color: #fff;
          box-shadow: 0 10px 20px rgba(36, 199, 104, 0.22);
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
        }

        .send:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }
      `}</style>
    </main>
  );
}
