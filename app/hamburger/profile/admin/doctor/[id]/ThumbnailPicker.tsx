/* path: app/hamburger/profile/admin/doctor/[id]/ThumbnailPicker.tsx */
'use client';

import { useMemo, useRef, useState } from 'react';

type Crop = { x: number; y: number };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

type Props = {
  doctorId: string;
  photoUrl: string | null;
  initialCrop: Crop | null;
};

export default function ThumbnailPicker({ doctorId, photoUrl, initialCrop }: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [crop, setCrop] = useState<Crop | null>(initialCrop);
  const [saving, setSaving] = useState(false);

  const objectPos = useMemo(() => {
    if (!crop) return '50% 50%';
    const x = clamp(Number(crop.x), 0, 100);
    const y = clamp(Number(crop.y), 0, 100);
    return `${x}% ${y}%`;
  }, [crop]);

  const onPick = (e: React.MouseEvent) => {
    if (!photoUrl) return;
    const el = boxRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;

    const next = { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
    setCrop(next);
    haptic('light');
  };

  const save = async () => {
    if (!crop || saving) return;
    haptic('medium');

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/doctors/${encodeURIComponent(doctorId)}/thumbnail`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: crop.x, y: crop.y }),
      });

      const j = await res.json().catch(() => ({} as any));
      if (!res.ok || !j?.ok) {
        const msg = j?.hint || j?.error || `Ошибка сохранения (${res.status})`;
        try { (window as any)?.Telegram?.WebApp?.showAlert?.(msg); } catch { alert(msg); }
        haptic('light');
        return;
      }

      try { (window as any)?.Telegram?.WebApp?.showAlert?.('Миниатюра сохранена ✅'); } catch {}
      haptic('light');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setCrop({ x: 50, y: 50 });
    haptic('light');
  };

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontWeight: 900, marginBottom: 6 }}>Миниатюра профиля</div>

      {photoUrl ? (
        <>
          <div
            ref={boxRef}
            onClick={onPick}
            style={{
              width: '100%',
              height: 220,
              borderRadius: 14,
              border: '1px solid #e5e7eb',
              background: '#f3f4f6',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'crosshair',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt="profile"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: objectPos,
                display: 'block',
              }}
            />

            {/* рамка как превью “кружка” */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 120,
                height: 120,
                transform: 'translate(-50%, -50%)',
                borderRadius: 999,
                border: '2px solid rgba(255,255,255,0.95)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                pointerEvents: 'none',
              }}
            />

            {/* точка выбранного центра */}
            {crop ? (
              <div
                style={{
                  position: 'absolute',
                  left: `${crop.x}%`,
                  top: `${crop.y}%`,
                  width: 10,
                  height: 10,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: 999,
                  background: '#22c55e',
                  border: '2px solid #fff',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.22)',
                  pointerEvents: 'none',
                }}
              />
            ) : null}
          </div>

          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
            Кликни по фото — это будет центр миниатюры (аватарки).
          </div>

          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              onClick={save}
              disabled={!crop || saving}
              style={{
                border: 0,
                borderRadius: 12,
                padding: '10px 10px',
                fontWeight: 900,
                cursor: saving ? 'default' : 'pointer',
                background: '#24c768',
                color: '#fff',
                opacity: !crop || saving ? 0.65 : 1,
              }}
            >
              {saving ? '…' : '💾 Сохранить'}
            </button>

            <button
              type="button"
              onClick={reset}
              disabled={saving}
              style={{
                border: '1px solid rgba(156,163,175,0.35)',
                borderRadius: 12,
                padding: '10px 10px',
                fontWeight: 900,
                cursor: saving ? 'default' : 'pointer',
                background: 'rgba(156,163,175,0.10)',
                color: '#374151',
              }}
            >
              Сброс (50/50)
            </button>
          </div>
        </>
      ) : (
        <div style={{ opacity: 0.7 }}>Фото профиля не загружено</div>
      )}
    </div>
  );
}

