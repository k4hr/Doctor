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

function timeAgoRu(input: string | Date) {
  const d = input instanceof Date ? input : new Date(input);
  const ts = d.getTime();
  if (!Number.isFinite(ts)) return '—';

  const diffMs = Date.now() - ts;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 60) return 'только что';

  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} мин назад`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч назад`;

  const days = Math.floor(hr / 24);
  if (days === 1) return '1 день назад';
  if (days >= 2 && days <= 4) return `${days} дня назад`;
  return `${days} дней назад`;
}

function safeSnippet(s: any) {
  const t = String(s ?? '').trim();
  if (!t) return '';
  const oneLine = t.replace(/\s+/g, ' ').trim();
  return oneLine.length > 120 ? oneLine.slice(0, 120).trim() + '…' : oneLine;
}

type ListItem = {
  id: string;
  status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CLOSED';
  createdAt: string;
  priceRub: number;

  doctorId: string;
  doctorName: string;
  doctorPhotoUrl?: string | null;

  // ✅ у пациента часто lastText пустой (ещё нет сообщений) — тогда покажем сниппет исходной проблемы
  lastText?: string | null;
  problemSnippet?: string | null; // если бэк уже отдаёт — будет текст как у врача
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

type UiStatus = 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CLOSED';

function normalizeStatus(s: any): UiStatus {
  const v = String(s || '').toUpperCase().trim();
  if (v === 'DRAFT' || v === 'PENDING' || v === 'ACCEPTED' || v === 'DECLINED' || v === 'CLOSED') return v as UiStatus;
  return 'PENDING';
}

function statusLabel(st: UiStatus) {
  if (st === 'ACCEPTED') return { text: 'Принята', tone: 'green' as const };
  if (st === 'DECLINED') return { text: 'Отказана', tone: 'red' as const };
  if (st === 'CLOSED') return { text: 'Закрыта', tone: 'gray' as const };
  if (st === 'DRAFT') return { text: 'Черновик', tone: 'gray' as const };
  return { text: 'Ожидает решения', tone: 'blue' as const };
}

function priceLabel(priceRub: number) {
  const p = Math.round(Number(priceRub) || 0);
  if (p > 0) return { text: `${p} ₽`, tone: 'gold' as const };
  return { text: 'Бесплатно', tone: 'free' as const };
}

/** ✅ Карточка визуально 1:1 как у врача (Card.tsx),
 *  но заголовок = имя врача и переход = ?id=..., чтобы не ломать роутинг */
function PatientConsultationCard({
  it,
  onOpen,
}: {
  it: ListItem;
  onOpen: () => void;
}) {
  const st = statusLabel(normalizeStatus(it.status));
  const pr = priceLabel(it.priceRub);

  const snippet =
    safeSnippet(it.lastText) ||
    safeSnippet(it.problemSnippet) ||
    // если совсем пусто — хотя бы статус, чтобы не было “—”
    st.text;

  const time = timeAgoRu(it.createdAt);

  return (
    <>
      <button type="button" className="cc" onClick={onOpen} aria-label="Открыть консультацию">
        <div className="ccTop">
          <div className="ccText">
            <div className="ccTitle">{String(it.doctorName || '').trim() || 'Врач'}</div>
            <div className="ccSnippet">{snippet}</div>
          </div>

          <div className="ccRight">
            <span className={`ccPill ${pr.tone === 'gold' ? 'ccPill--gold' : 'ccPill--free'}`}>{pr.text}</span>

            <span
              className={`ccPill ${
                st.tone === 'green'
                  ? 'ccPill--green'
                  : st.tone === 'blue'
                  ? 'ccPill--blue'
                  : st.tone === 'red'
                  ? 'ccPill--red'
                  : 'ccPill--gray'
              }`}
            >
              {st.text}
            </span>
          </div>
        </div>

        <div className="ccBottom">
          <span className="ccTime">{time}</span>
        </div>
      </button>

      <style jsx>{`
        .cc {
          width: 100%;
          text-align: left;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;

          border: 1px solid rgba(10, 12, 20, 0.08);
          background: rgba(255, 255, 255, 0.96);
          border-radius: 18px;

          padding: 10px 12px 9px;

          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.07);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);

          position: relative;

          display: flex;
          flex-direction: column;

          height: 92px;
          overflow: hidden;

          justify-content: space-between;
        }

        .cc::after {
          content: '';
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 0px;

          height: 1px;
          background: rgba(15, 23, 42, 0.08);

          transform: scaleY(0.5);
          transform-origin: bottom;
          pointer-events: none;
        }

        .cc:active {
          transform: translateY(1px);
          box-shadow: 0 6px 18px rgba(18, 28, 45, 0.11);
        }

        .ccTop {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: start;
          gap: 10px;
          min-width: 0;
        }

        .ccText {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .ccTitle {
          font-size: 12px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.8);
          line-height: 1.05;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ccSnippet {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #022c22;

          line-height: 16px;
          height: 32px;
          max-height: 32px;

          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-width: 0;
        }

        .ccRight {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .ccPill {
          flex: 0 0 auto;

          font-size: 11px;
          font-weight: 600;
          padding: 4px 9px;

          border-radius: 999px;
          border: 1px solid transparent;
          white-space: nowrap;
          line-height: 1.05;
        }

        .ccPill--free {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.1);
          color: rgba(15, 23, 42, 0.7);
        }

        .ccPill--gold {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.3);
          color: #92400e;
        }

        .ccPill--green {
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.3);
          color: rgba(22, 163, 74, 1);
        }

        .ccPill--blue {
          background: rgba(59, 130, 246, 0.12);
          border-color: rgba(59, 130, 246, 0.3);
          color: rgba(37, 99, 235, 1);
        }

        .ccPill--red {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.28);
          color: rgba(185, 28, 28, 1);
        }

        .ccPill--gray {
          background: rgba(15, 23, 42, 0.04);
          border-color: rgba(15, 23, 42, 0.12);
          color: rgba(15, 23, 42, 0.7);
        }

        .ccBottom {
          display: flex;
          justify-content: flex-end;
          align-items: end;
          min-width: 0;
          margin-top: 2px;
        }

        .ccTime {
          white-space: nowrap;
          font-size: 11px;
          font-weight: 600;
          color: rgba(15, 23, 42, 0.62);
          line-height: 1.05;
        }
      `}</style>
    </>
  );
}

export default function HamburgerConsultationsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const chatId = String(sp?.get('id') || '').trim();

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

        setItems(Array.isArray((j as ApiOkList).items) ? (j as ApiOkList).items : []);
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
      <TopBarBack />

      <h1 className="t">{chatId ? title : 'Консультации'}</h1>
      <p className="s">
        {chatId ? (detail ? `Консультация • ${fmtDateTime(detail.createdAt)}` : 'загрузка…') : 'Ваши консультации'}
      </p>

      {chatId ? (
        <button className="backBtn" type="button" onClick={closeChat}>
          Назад
        </button>
      ) : null}

      {warn ? <div className="warn">{warn}</div> : null}

      {/* ====== LIST ====== */}
      {!chatId ? (
        loading ? (
          <div className="muted">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="muted">Пока консультаций нет.</div>
        ) : (
          <section className="cards" aria-label="Список консультаций">
            {items.map((it) => (
              <PatientConsultationCard key={it.id} it={it} onOpen={() => openChat(it.id)} />
            ))}
          </section>
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
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          background: #f6f7fb;
          overflow-x: hidden;
        }

        .t {
          margin: 6px 0 0;
          font-size: 34px;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .s {
          margin: 8px 0 14px;
          font-size: 16px;
          font-weight: 600;
          color: rgba(17, 24, 39, 0.58);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .backBtn {
          width: 100%;
          margin: 0 0 12px;
          border: 1px solid rgba(15, 23, 42, 0.14);
          background: rgba(255, 255, 255, 0.92);
          border-radius: 18px;
          padding: 12px 14px;
          font-size: 16px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.78);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.05);
        }
        .backBtn:active {
          transform: scale(0.99);
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

        .card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 18px;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
          padding: 12px;
          margin-bottom: 12px;
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
          grid-template-columns: repeat(3, minmax(0, 1fr));
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
          grid-template-columns: minmax(0, 1fr) auto;
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
