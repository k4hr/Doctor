'use client';

import { useMemo, useState } from 'react';

type Props = {
  doctorId: string;
  currentStatus: string;
};

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

export default function DoctorAdminActions({ doctorId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(currentStatus);

  const canApprove = useMemo(
    () => localStatus !== 'APPROVED',
    [localStatus]
  );

  const patchStatus = async (nextStatus: 'APPROVED' | 'NEED_FIX' | 'REJECTED' | 'PENDING' | 'DRAFT') => {
    if (loading) return;
    haptic('medium');

    try {
      setLoading(true);

      const res = await fetch(`/api/admin/doctor/${encodeURIComponent(doctorId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const j = await res.json().catch(() => ({} as any));
      if (!res.ok || !j?.ok) {
        haptic('light');
        const msg = j?.hint || j?.error || `Ошибка смены статуса (${res.status})`;
        try {
          (window as any)?.Telegram?.WebApp?.showAlert?.(msg);
        } catch {
          alert(msg);
        }
        return;
      }

      setLocalStatus(j.status || nextStatus);
      haptic('light');

      try {
        (window as any)?.Telegram?.WebApp?.showAlert?.(`Статус обновлён: ${j.status || nextStatus}`);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>
        Модерация анкеты: текущий статус <b>{localStatus}</b>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <button
          type="button"
          disabled={loading || !canApprove}
          onClick={() => patchStatus('APPROVED')}
          style={{
            border: 0,
            borderRadius: 12,
            padding: '10px 10px',
            fontWeight: 900,
            cursor: loading ? 'default' : 'pointer',
            background: canApprove ? '#24c768' : 'rgba(34,197,94,0.25)',
            color: '#fff',
          }}
        >
          {loading ? '…' : 'APPROVE'}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => patchStatus('NEED_FIX')}
          style={{
            border: 0,
            borderRadius: 12,
            padding: '10px 10px',
            fontWeight: 900,
            cursor: loading ? 'default' : 'pointer',
            background: '#f59e0b',
            color: '#111827',
          }}
        >
          {loading ? '…' : 'NEED_FIX'}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => patchStatus('REJECTED')}
          style={{
            border: 0,
            borderRadius: 12,
            padding: '10px 10px',
            fontWeight: 900,
            cursor: loading ? 'default' : 'pointer',
            background: '#ef4444',
            color: '#fff',
          }}
        >
          {loading ? '…' : 'REJECT'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button
          type="button"
          disabled={loading}
          onClick={() => patchStatus('PENDING')}
          style={{
            border: '1px solid rgba(15,23,42,0.12)',
            borderRadius: 12,
            padding: '10px 10px',
            fontWeight: 900,
            cursor: loading ? 'default' : 'pointer',
            background: '#fff',
            color: '#111827',
          }}
        >
          В PENDING
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => patchStatus('DRAFT')}
          style={{
            border: '1px solid rgba(15,23,42,0.12)',
            borderRadius: 12,
            padding: '10px 10px',
            fontWeight: 900,
            cursor: loading ? 'default' : 'pointer',
            background: '#fff',
            color: '#111827',
          }}
        >
          В DRAFT
        </button>
      </div>
    </div>
  );
}
