/* path: app/hamburger/profile/consultations/page.tsx */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopBarBack from '../../../../components/TopBarBack';

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

type ListItem = {
  id: string;
  status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CLOSED';
  createdAt: string;
  priceRub: number;

  doctorId: string;
  doctorName: string;
  doctorPhotoUrl?: string | null;

  lastText?: string | null;
};

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

  doctorId: string;
  doctorName: string;
  doctorPhotoUrl?: string | null;

  problemText: string;
  photos: string[];

  messages: Msg[];
};

type ApiOkList = { ok: true; items: ListItem[] };
type ApiOkDetail = { ok: true; item: Detail };
type ApiErr = { ok: false; error: string; hint?: string };

export default function HamburgerConsultationsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const chatId = String(sp?.get('id') || '').trim(); // если есть — показываем чат

  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');

  const [items, setItems] = useState<ListItem[]>([]);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);

  const title = useMemo(() => {
    if (chatId && detail?.doctorName) return detail.doctorName;
    return 'Консультации';
  }, [chatId, detail?.doctorName]);

  useEffect(() => {
    try {
      tg()?.ready?.();
      tg()?.expand?.();
    } catch {}
  }, []);

  // список
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setWarn('');

        const idata = tg()?.initData || '';
        const res = await fetch('/api/profile/consultations', {
          method: 'GET',
          headers: { 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
          cache: 'no-store',
        });

        const j = (await res.json().catch(() => null)) as (ApiOkList | ApiErr) | null;
        if (!res.ok || !j || (j as any).ok !== true) {
          setWarn(String((j as any)?.hint || (j as any)?.error || 'Не удалось загрузить список'));
          setItems([]);
          return;
        }

        setItems((j as ApiOkList).items || []);
      } catch (e: any) {
        console.error(e);
        setWarn(String(e?.message || 'Сеть/сервер недоступны'));
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // детали чата
  useEffect(() => {
    if (!chatId) {
      setDetail(null);
      setText('');
      return;
    }

    (async () => {
      try {
        setDetailLoading(true);
        setWarn('');

        const idata = tg()?.initData || '';
        const res = await fetch(`/api/profile/consultations/${encodeURIComponent(chatId)}`, {
          method: 'GET',
          headers: { 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
          cache: 'no-store',
        });

        const j = (await res.json().catch(() => null)) as (ApiOkDetail | ApiErr) | null;
        if (!res.ok || !j || (j as any).ok !== true) {
          setWarn(String((j as any)?.hint || (j as any)?.error || 'Не удалось загрузить консультацию'));
          setDetail(null);
          return;
        }

        setDetail((j as ApiOkDetail).item);
      } catch (e: any) {
        console.error(e);
        setWarn(String(e?.message || 'Сеть/сервер недоступны'));
        setDetail(null);
      } finally {
        setDetailLoading(false);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'instant' as any, block: 'end' }), 50);
      }
    })();
  }, [chatId]);

  function openChat(id: string) {
    haptic('light');
    router.push(`/hamburger/profile/consultations?id=${encodeURIComponent(id)}`);
  }

  function closeChat() {
    haptic('light');
    router.push('/hamburger/profile/consultations');
  }

  async function reloadDetail() {
    if (!chatId) return;
    const idata = tg()?.initData || '';
    try {
      setWarn('');
      const res = await fetch(`/api/profile/consultations/${encodeURIComponent(chatId)}`, {
        method: 'GET',
        headers: { 'X-Telegram-Init-Data': idata, 'X-Init-Data': idata },
        cache: 'no-store',
      });
      const j = (await res.json().catch(() => null)) as (ApiOkDetail | ApiErr) | null;
      if (!res.ok || !j || (j as any).ok !== true) {
        setWarn(String((j as any)?.hint || (j as any)?.error || 'Не удалось обновить'));
        return;
      }
      setDetail((j as ApiOkDetail).item);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    } catch (e: any) {
      setWarn(String(e?.message || 'Сеть/сервер недоступны'));
    }
  }

  const canChat = !!detail && detail.status === 'ACCEPTED';

  async function send() {
    if (!detail || !chatId) return;

    if (!canChat) {
      tgAlert('Чат будет доступен после принятия (и далее — после оплаты).');
      return;
    }

    const body = String(text || '').trim();
    if (!body) return;

    setSending(true);
    setWarn('');

    const idata = tg()?.initData || '';
    try {
      const res = await fetch(`/api/profile/consultations/${encodeURIComponent(chatId)}/messages`, {
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
      await reloadDetail();
    } catch (e: any) {
      tgAlert(String(e?.message || 'Сеть/сервер недоступны'));
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="p">
      <div className="top">
        <TopBarBack />
        <div className="head">
          <div className="title">{title}</div>
          <div className="sub">
            {chatId ? (detail ? `Консультация • ${fmtDateTime(detail.createdAt)}` : 'загрузка…') : 'Ваши консультации'}
          </div>
        </div>

        {chatId ? (
          <button className="x" type="button" onClick={closeChat}>
            Назад
          </button>
        ) : null}
      </div>

      {warn ? <div className="warn">{warn}</div> : null}

      {/* ====== LIST ====== */}
      {!chatId ? (
        loading ? (
          <div className="card">
            <div className="muted">Загрузка…</div>
          </div>
        ) : items.length === 0 ? (
          <div className="card">
            <div className="muted">Пока консультаций нет.</div>
          </div>
        ) : (
          <div className="list">
            {items.map((it) => (
              <button key={it.id} className="rowBtn" type="button" onClick={() => openChat(it.id)}>
                <div className="ava">
                  {it.doctorPhotoUrl ? <img src={it.doctorPhotoUrl} alt={it.doctorName} /> : <div className="ph" />}
                </div>

                <div className="mid">
                  <div className="nm">{it.doctorName}</div>
                  <div className="sm">
                    {it.status === 'PENDING'
                      ? 'Ожидает решения врача'
                      : it.status === 'ACCEPTED'
                      ? 'Принята (ожидает оплату / чат)'
                      : it.status === 'DECLINED'
                      ? 'Отклонена'
                      : it.status === 'CLOSED'
                      ? 'Закрыта'
                      : 'Черновик'}
                    {` • ${Math.round(it.priceRub || 0)} ₽`}
                  </div>

                  {it.lastText ? <div className="prev">{it.lastText}</div> : null}
                </div>

                <div className="rt">
                  <div className="dt">{fmtDateTime(it.createdAt)}</div>
                  <div className="go">›</div>
                </div>
              </button>
            ))}
          </div>
        )
      ) : null}

      {/* ====== CHAT ====== */}
      {chatId ? (
        detailLoading ? (
          <div className="card">
            <div className="muted">Загрузка…</div>
          </div>
        ) : !detail ? (
          <div className="card">
            <div className="muted">Не найдено.</div>
          </div>
        ) : (
          <>
            <section className="card">
              <div className="row">
                <div className="lbl">Статус</div>
                <div className="val">
                  {detail.status === 'PENDING'
                    ? 'Ожидает решения'
                    : detail.status === 'ACCEPTED'
                    ? 'Принята'
                    : detail.status === 'DECLINED'
                    ? 'Отклонена'
                    : detail.status === 'CLOSED'
                    ? 'Закрыта'
                    : 'Черновик'}
                </div>
              </div>

              <div className="row">
                <div className="lbl">Цена</div>
                <div className="val">{Math.round(detail.priceRub || 0)} ₽</div>
              </div>

              <div className="hr" />

              <div className="lbl2">Ваше сообщение</div>
              <div className="body">{detail.problemText}</div>

              {detail.photos?.length ? (
                <>
                  <div className="lbl2" style={{ marginTop: 10 }}>
                    Фото
                  </div>
                  <div className="photos">
                    {detail.photos.map((u, i) => (
                      <a key={u + i} className="ph2" href={u} target="_blank" rel="noreferrer">
                        <img src={u} alt={`photo-${i + 1}`} />
                      </a>
                    ))}
                  </div>
                </>
              ) : null}

              {detail.status === 'ACCEPTED' ? (
                <div className="hintPay">
                  Врач принял консультацию. Следующий шаг — оплата пациентом (подключим оплату следующим шагом).
                </div>
              ) : null}
            </section>

            <section className="chat">
              <div className="msgs" aria-label="Сообщения">
                {detail.messages.length === 0 ? (
                  <div className="empty">Пока сообщений нет.</div>
                ) : (
                  detail.messages.map((m) => (
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
                  placeholder={canChat ? 'Написать сообщение…' : 'Чат откроется после принятия (и оплаты)'}
                  disabled={!canChat || sending}
                />
                <button className="send" type="button" onClick={send} disabled={!canChat || sending || !text.trim()}>
                  Отправить
                </button>
              </div>
            </section>
          </>
        )
      ) : null}

      <style jsx>{`
        .p {
          min-height: 100dvh;
          padding: 12px 12px calc(env(safe-area-inset-bottom, 0px) + 18px);
          background: #f6f7fb;
        }

        .top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
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

        .x {
          border: none;
          height: 34px;
          padding: 0 12px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.06);
          color: rgba(17, 24, 39, 0.86);
          font-size: 12px;
          font-weight: 950;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .warn {
          margin: 0 0 10px;
          font-size: 12px;
          font-weight: 900;
          color: #ef4444;
          overflow-wrap: anywhere;
        }

        .card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 18px;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
          padding: 12px;
          margin-bottom: 12px;
        }

        .muted {
          font-weight: 800;
          color: rgba(15, 23, 42, 0.65);
          font-size: 13px;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .rowBtn {
          width: 100%;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
          padding: 12px;
          display: grid;
          grid-template-columns: 44px 1fr auto;
          gap: 10px;
          text-align: left;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .ava {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(15, 23, 42, 0.03);
        }

        .ava img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ph {
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.06);
        }

        .mid {
          min-width: 0;
        }

        .nm {
          font-size: 14px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sm {
          margin-top: 2px;
          font-size: 12px;
          font-weight: 850;
          color: rgba(17, 24, 39, 0.6);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .prev {
          margin-top: 6px;
          font-size: 12px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.72);
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .rt {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .dt {
          font-size: 11px;
          font-weight: 850;
          color: rgba(17, 24, 39, 0.45);
          white-space: nowrap;
        }

        .go {
          font-size: 22px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.35);
          line-height: 1;
        }

        .row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
        }

        .lbl {
          font-size: 12px;
          font-weight: 900;
          color: rgba(15, 23, 42, 0.58);
        }

        .val {
          font-size: 12px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.84);
          white-space: nowrap;
        }

        .hr {
          height: 1px;
          background: rgba(15, 23, 42, 0.08);
          margin: 10px 0;
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
        }

        .photos {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 6px;
        }

        .ph2 {
          display: block;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(15, 23, 42, 0.03);
        }

        .ph2 img {
          width: 100%;
          height: 110px;
          object-fit: cover;
          display: block;
        }

        .hintPay {
          margin-top: 10px;
          padding: 10px;
          border-radius: 14px;
          border: 1px solid rgba(59, 130, 246, 0.22);
          background: rgba(59, 130, 246, 0.08);
          color: rgba(17, 24, 39, 0.78);
          font-size: 12px;
          font-weight: 800;
          line-height: 1.35;
        }

        .chat {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 18px;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
          overflow: hidden;
        }

        .msgs {
          padding: 12px;
          max-height: 48vh;
          overflow: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .empty {
          font-size: 12px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.55);
        }

        .msg {
          display: flex;
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
