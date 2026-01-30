/* path: app/vopros/[id]/AnswerComments.tsx */
'use client';

import React from 'react';

type UiComment = {
  id: string;
  createdAt: string;
  authorType: string; // 'USER' | 'DOCTOR'
  authorDoctorName: string | null;
  body: string;
};

function fmtRuMsk(iso: string) {
  const d = new Date(iso);
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

function tgInitData(): string {
  const w: any = window as any;
  return String(w?.Telegram?.WebApp?.initData || '').trim();
}

export default function AnswerComments(props: {
  answerId: string;
  canComment: boolean;
  initialComments: UiComment[];
}) {
  const [items, setItems] = React.useState<UiComment[]>(props.initialComments || []);
  const [text, setText] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function submit() {
    const body = String(text || '').trim();
    if (!body) return;

    setBusy(true);
    setErr(null);

    try {
      const res = await fetch('/api/answer/comment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answerId: props.answerId,
          body,
          initData: tgInitData(),
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setErr(String(json?.error || 'FAILED'));
        return;
      }

      const created: UiComment = {
        id: String(json.id),
        createdAt: String(json.createdAt),
        authorType: String(json.authorType),
        authorDoctorName: json.authorDoctorName ? String(json.authorDoctorName) : null,
        body: String(json.body || body),
      };

      setItems((prev) => [...prev, created]);
      setText('');
    } catch (e: any) {
      setErr(String(e?.message || 'NETWORK_FAILED'));
    } finally {
      setBusy(false);
    }
  }

  const boxStyle: React.CSSProperties = {
    marginTop: 12,
    paddingTop: 10,
    borderTop: '1px solid rgba(15,23,42,0.08)',
    display: 'grid',
    gap: 10,
  };

  const commentStyle: React.CSSProperties = {
    padding: 10,
    borderRadius: 14,
    border: '1px solid rgba(15,23,42,0.10)',
    background: 'rgba(15,23,42,0.03)',
    display: 'grid',
    gap: 6,
  };

  return (
    <div style={boxStyle}>
      <div style={{ fontWeight: 900, fontSize: 13 }}>Комментарии</div>

      {items.length === 0 ? (
        <div style={{ opacity: 0.65, fontSize: 12 }}>Пока нет комментариев.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map((c) => {
            const who =
              c.authorType === 'DOCTOR'
                ? c.authorDoctorName
                  ? `Врач: ${c.authorDoctorName}`
                  : 'Врач'
                : 'Автор вопроса';

            return (
              <div key={c.id} style={commentStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(15,23,42,0.75)' }}>{who}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(15,23,42,0.55)', whiteSpace: 'nowrap' }}>
                    {fmtRuMsk(c.createdAt)}
                  </div>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.45, color: 'rgba(11,12,16,0.86)' }}>
                  {c.body}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!props.canComment ? (
        <div style={{ opacity: 0.65, fontSize: 12 }}>
          Комментарии доступны только автору вопроса и врачу, который оставил этот ответ.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Написать комментарий…"
            rows={3}
            style={{
              width: '100%',
              resize: 'vertical',
              padding: 10,
              borderRadius: 14,
              border: '1px solid rgba(15,23,42,0.14)',
              outline: 'none',
              fontSize: 13,
              lineHeight: 1.4,
            }}
          />

          {err ? (
            <div style={{ color: '#b91c1c', fontSize: 12, fontWeight: 800 }}>
              Ошибка: {err}
            </div>
          ) : null}

          <button
            onClick={submit}
            disabled={busy || !String(text || '').trim()}
            style={{
              padding: '10px 12px',
              borderRadius: 14,
              border: '1px solid rgba(15,23,42,0.14)',
              background: busy ? 'rgba(15,23,42,0.06)' : 'rgba(34,197,94,0.16)',
              fontWeight: 900,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {busy ? 'Отправка…' : 'Отправить'}
          </button>
        </div>
      )}
    </div>
  );
}
