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

function statusLabel(status: string) {
  switch (status) {
    case 'APPROVED':
      return 'Одобрено';
    case 'PENDING':
      return 'На проверке';
    case 'NEED_FIX':
      return 'Нужны правки';
    case 'REJECTED':
      return 'Отклонено';
    case 'DRAFT':
      return 'Черновик';
    default:
      return status;
  }
}

export default function DoctorAdminActions({ doctorId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(currentStatus);

  const canApprove = useMemo(() => localStatus !== 'APPROVED', [localStatus]);

  const patchStatus = async (
    nextStatus: 'APPROVED' | 'NEED_FIX' | 'REJECTED' | 'PENDING' | 'DRAFT'
  ) => {
    if (loading) return;

    const nextLabel = statusLabel(nextStatus);

    // Мини-подтверждение только для “жёстких” действий
    if (nextStatus === 'REJECTED') {
      const ok = confirm('Точно отклонить анкету?');
      if (!ok) return;
    }

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

      const newStatus = String(j.status || nextStatus);
      setLocalStatus(newStatus);
      haptic('light');

      const txt = `Статус обновлён: ${statusLabel(newStatus)} (${newStatus})`;
      try {
        (window as any)?.Telegram?.WebApp?.showAlert?.(txt);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 12, opacity: 0.75 }}>
        Модерация анкеты: <b>{statusLabel(localStatus)}</b> <span style={{ opacity: 0.6 }}>({localStatus})</span>
      </div>

      {/* Основные действия */}
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
          {loading ? '…' : '✅ Одобрить'}
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
          {loading ? '…' : '✏️ Нужны правки'}
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
          {loading ? '…' : '⛔ Отклонить'}
        </button>
      </div>

      {/* Тех. статусы */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button
          type="button"
          disabled={loading}
          onClick={() => patchStatus('PENDING')}
          style={{
            border: '1px solid rgba(59,130,246,0.35)',
            borderRadius: 12,
            padding: '10px 10px',
            fontWeight: 900,
            cursor: loading ? 'default' : 'pointer',
            background: 'rgba(59,130,246,0.08)',
            color: '#1e40af',
          }}
        >
          В «На проверке»
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => patchStatus('DRAFT')}
          style={{
            border: '1px solid rgba(156,163,175,0.35)',
            borderRadius: 12,
            padding: '10px 10px',
            fontWeight: 900,
            cursor: loading ? 'default' : 'pointer',
            background: 'rgba(156,163,175,0.10)',
            color: '#374151',
          }}
        >
          В «Черновик»
        </button>
      </div>

      <div style={{ fontSize: 11, opacity: 0.6, lineHeight: 1.35 }}>
        <b>Подсказка:</b> «Нужны правки» — анкета ок, но надо исправить/добавить данные. «Отклонено» — анкета не проходит модерацию.
      </div>
    </div>
  );
}
