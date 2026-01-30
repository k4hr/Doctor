/* path: app/vopros/[id]/AnswerCreate.tsx */
'use client';

import React from 'react';

function tgInitData(): string {
  const w: any = window as any;
  return String(w?.Telegram?.WebApp?.initData || '').trim();
}

export default function AnswerCreate(props: {
  questionId: string;
  canAnswer: boolean;
  reason: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function submit() {
    const body = String(text || '').trim();
    if (!body) return;

    setBusy(true);
    setErr(null);

    try {
      const res = await fetch('/api/answer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: props.questionId,
          body,
          initData: tgInitData(),
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setErr(String(json?.error || 'FAILED'));
        return;
      }

      // проще всего: перегрузить, чтобы сервер отдал список answers уже с новым ответом
      window.location.reload();
    } catch (e: any) {
      setErr(String(e?.message || 'NETWORK_FAILED'));
    } finally {
      setBusy(false);
    }
  }

  const box: React.CSSProperties = {
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    border: '1px solid rgba(15,23,42,0.08)',
    background: 'rgba(255,255,255,0.85)',
    boxShadow: '0 10px 26px rgba(18, 28, 45, 0.06)',
    display: 'grid',
    gap: 10,
  };

  if (!props.canAnswer) {
    return (
      <div style={box}>
        <div style={{ fontWeight: 900, fontSize: 13 }}>Ответить</div>
        <div style={{ opacity: 0.7, fontSize: 12 }}>{props.reason || 'Недоступно.'}</div>
      </div>
    );
  }

  return (
    <div style={box}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontWeight: 900, fontSize: 13 }}>Ответить</div>

        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            padding: '8px 10px',
            borderRadius: 12,
            border: '1px solid rgba(15,23,42,0.14)',
            background: 'rgba(34,197,94,0.16)',
            fontWeight: 900,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {open ? 'Свернуть' : 'Написать ответ'}
        </button>
      </div>

      {!open ? null : (
        <div style={{ display: 'grid', gap: 8 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Введите ответ клиенту…"
            rows={5}
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
            {busy ? 'Отправка…' : 'Отправить ответ'}
          </button>
        </div>
      )}
    </div>
  );
}
