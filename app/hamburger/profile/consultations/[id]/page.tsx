/* path: app/hamburger/profile/consultations/[id]/page.tsx */
'use client';

import type React from 'react';
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

  const pageStyle: React.CSSProperties = {
    padding: 16,
    overflowX: 'hidden',
    background: '#f6f7fb',
    minHeight: '100dvh',
    width: '100%',
    maxWidth: '100%',
  };

  const wrapText: React.CSSProperties = { overflowWrap: 'anywhere', wordBreak: 'break-word' };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    border: '1px solid rgba(10,12,20,0.08)',
    background: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    padding: 14,
    boxShadow: '0 10px 26px rgba(18, 28, 45, 0.08)',
    display: 'grid',
    gap: 12,
  };

  const metaBoxStyle: React.CSSProperties = {
    borderRadius: 16,
    border: '1px solid rgba(15,23,42,0.06)',
    background: 'rgba(15,23,42,0.02)',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 0,
    overflow: 'hidden',
  };

  const metaLabelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 900,
    color: 'rgba(15,23,42,0.58)',
    lineHeight: 1.1,
    ...wrapText,
  };

  const metaValueStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 950,
    color: 'rgba(17,24,39,0.88)',
    lineHeight: 1.15,
    ...wrapText,
  };

  const chatStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    border: '1px solid rgba(10,12,20,0.08)',
    background: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    boxShadow: '0 10px 26px rgba(18, 28, 45, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 340,
  };

  const msgsStyle: React.CSSProperties = {
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    overflowY: 'auto',
    overflowX: 'hidden',
    minHeight: 0,
    flex: '1 1 auto',
    WebkitOverflowScrolling: 'touch' as any,
  };

  const composerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 10,
    padding: 10,
    borderTop: '1px solid rgba(15,23,42,0.08)',
    background: 'rgba(255,255,255,0.9)',
    width: '100%',
    maxWidth: '100%',
  };

  const inpStyle: React.CSSProperties = {
    height: 42,
    borderRadius: 14,
    border: '1px solid rgba(15, 23, 42, 0.12)',
    background: 'rgba(249, 250, 251, 0.9)',
    padding: '0 12px',
    fontSize: 14,
    fontWeight: 800,
    color: '#111827',
    outline: 'none',
    minWidth: 0,
    width: '100%',
  };

  const sendStyle: React.CSSProperties = {
    height: 42,
    borderRadius: 14,
    border: 'none',
    padding: '0 14px',
    fontSize: 14,
    fontWeight: 950,
    cursor: 'pointer',
    background: '#24c768',
    color: '#fff',
    boxShadow: '0 10px 20px rgba(36, 199, 104, 0.22)',
    WebkitTapHighlightColor: 'transparent' as any,
    whiteSpace: 'nowrap',
  };

  const pillBase: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    padding: '6px 10px',
    borderRadius: 999,
    border: '1px solid rgba(15,23,42,0.10)',
    background: 'rgba(15,23,42,0.03)',
    color: 'rgba(15,23,42,0.75)',
    lineHeight: 1.05,
    whiteSpace: 'nowrap',
  };

  const pillGreen: React.CSSProperties = {
    ...pillBase,
    borderColor: 'rgba(16,185,129,0.25)',
    background: 'rgba(16,185,129,0.10)',
    color: 'rgba(5,150,105,1)',
  };

  const pillRed: React.CSSProperties = {
    ...pillBase,
    borderColor: 'rgba(239,68,68,0.25)',
    background: 'rgba(239,68,68,0.08)',
    color: 'rgba(185,28,28,1)',
  };

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
    <main style={pageStyle}>
      <TopBarBack />

      <h1 style={{ marginTop: 8, marginBottom: 10, fontSize: 34, fontWeight: 950, lineHeight: 1.05, ...wrapText }}>
        {title}
      </h1>

      <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(17,24,39,0.55)', marginBottom: 12, ...wrapText }}>
        {item ? `Консультация • ${fmtDateTime(item.createdAt)}` : 'загрузка…'}
      </div>

      {warn ? (
        <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 900, color: '#ef4444', ...wrapText }}>{warn}</div>
      ) : null}

      {loading ? (
        <section style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(15,23,42,0.55)' }}>Загрузка…</div>
        </section>
      ) : !item ? (
        <section style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(15,23,42,0.55)' }}>Не найдено.</div>
        </section>
      ) : (
        <>
          <section style={cardStyle}>
            {/* ✅ ВОТ КЛЮЧЕВОЕ: мета БЛОКАМИ ВНИЗ */}
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={metaBoxStyle}>
                <div style={metaLabelStyle}>Статус</div>
                <div style={metaValueStyle}>{statusText}</div>
              </div>

              <div style={metaBoxStyle}>
                <div style={metaLabelStyle}>Цена</div>
                <div style={metaValueStyle}>{Math.round(item.priceRub || 0)} ₽</div>
              </div>

              <div style={metaBoxStyle}>
                <div style={metaLabelStyle}>Оплата</div>
                <div style={metaValueStyle}>{item.paidAt ? 'Оплачено' : 'Не оплачено'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
              {item.status === 'PENDING' ? <span style={pillBase}>Ждём решения врача</span> : null}
              {item.status === 'DECLINED' ? <span style={pillRed}>Врач отказал</span> : null}
              {item.status === 'ACCEPTED' && item.paidAt ? <span style={pillGreen}>Оплачено. Чат открыт</span> : null}
              {item.status === 'ACCEPTED' && !item.paidAt ? <span style={pillBase}>Нужно оплатить</span> : null}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(15,23,42,0.08)', margin: '8px 0' }} />

            <div style={{ fontWeight: 950, fontSize: 14, color: 'rgba(17,24,39,0.88)', marginBottom: 6 }}>
              Ваше сообщение
            </div>

            <div style={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(11,12,16,0.82)', whiteSpace: 'pre-wrap', ...wrapText }}>
              {String(item.problemText || '').trim() || '—'}
            </div>

            {item.photos?.length ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontWeight: 900, marginTop: 6 }}>Фото</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                  {item.photos.map((u, i) => (
                    <a
                      key={u + i}
                      href={u}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'block',
                        borderRadius: 14,
                        overflow: 'hidden',
                        border: '1px solid rgba(15, 23, 42, 0.08)',
                        background: 'rgba(15, 23, 42, 0.03)',
                      }}
                    >
                      <img
                        src={u}
                        alt={`photo-${i + 1}`}
                        style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {item.status === 'ACCEPTED' && !item.paidAt ? (
              <button
                type="button"
                onClick={markPaidMock}
                disabled={paying}
                style={{
                  marginTop: 10,
                  width: '100%',
                  border: 'none',
                  borderRadius: 16,
                  padding: '12px 12px',
                  fontSize: 14,
                  fontWeight: 950,
                  color: '#fff',
                  cursor: paying ? 'not-allowed' : 'pointer',
                  background: '#24c768',
                  boxShadow: paying ? 'none' : '0 10px 20px rgba(36, 199, 104, 0.28)',
                  opacity: paying ? 0.75 : 1,
                  WebkitTapHighlightColor: 'transparent' as any,
                }}
              >
                {paying ? 'Оплачиваем…' : 'Оплатить (мок)'}
              </button>
            ) : null}
          </section>

          <section style={{ ...chatStyle, marginTop: 12 }}>
            <div style={msgsStyle} aria-label="Сообщения">
              {item.messages.length === 0 ? (
                <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(15,23,42,0.55)' }}>Пока сообщений нет.</div>
              ) : (
                item.messages.map((m) => {
                  const isMe = m.authorType === 'USER';
                  return (
                    <div
                      key={m.id}
                      style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', maxWidth: '100%' }}
                    >
                      <div
                        style={{
                          maxWidth: '78%',
                          borderRadius: 16,
                          padding: '10px 10px 8px',
                          border: isMe ? '1px solid rgba(36, 199, 104, 0.25)' : '1px solid rgba(15, 23, 42, 0.08)',
                          background: isMe ? 'rgba(36, 199, 
