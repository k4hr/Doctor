/* path: app/hamburger/profile/admin/doctor/[id]/ThumbnailPicker.tsx */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Crop = { x: number; y: number; zoom?: number };

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

  const [crop, setCrop] = useState<Crop | null>(() => {
    if (!initialCrop) return { x: 50, y: 50, zoom: 1 };
    const z = Number((initialCrop as any).zoom);
    return {
      x: Number.isFinite(Number(initialCrop.x)) ? Number(initialCrop.x) : 50,
      y: Number.isFinite(Number(initialCrop.y)) ? Number(initialCrop.y) : 50,
      zoom: Number.isFinite(z) ? clamp(z, 1, 3) : 1,
    };
  });

  const [saving, setSaving] = useState(false);

  // Pinch-zoom state
  const pinchRef = useRef<{
    active: boolean;
    startDist: number;
    startZoom: number;
  }>({ active: false, startDist: 0, startZoom: 1 });

  const x = useMemo(() => clamp(Number(crop?.x ?? 50), 0, 100), [crop?.x]);
  const y = useMemo(() => clamp(Number(crop?.y ?? 50), 0, 100), [crop?.y]);
  const zoom = useMemo(() => clamp(Number(crop?.zoom ?? 1), 1, 3), [crop?.zoom]);

  const objectPos = useMemo(() => `${x}% ${y}%`, [x, y]);

  const setZoom = (nextZoom: number, vibe: 'light' | 'medium' = 'light') => {
    setCrop((prev) => {
      const p = prev ?? { x: 50, y: 50, zoom: 1 };
      return { ...p, zoom: clamp(nextZoom, 1, 3) };
    });
    haptic(vibe);
  };

  const setCenterFromPoint = (clientX: number, clientY: number) => {
    if (!photoUrl) return;
    const el = boxRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const nx = ((clientX - r.left) / r.width) * 100;
    const ny = ((clientY - r.top) / r.height) * 100;

    setCrop((prev) => {
      const p = prev ?? { x: 50, y: 50, zoom: 1 };
      return { ...p, x: clamp(nx, 0, 100), y: clamp(ny, 0, 100) };
    });
  };

  const onPick = (e: React.MouseEvent) => {
    setCenterFromPoint(e.clientX, e.clientY);
    haptic('light');
  };

  // Desktop: wheel zoom
  const onWheel = (e: React.WheelEvent) => {
    if (!photoUrl) return;
    // Avoid page scrolling when zooming inside the box
    e.preventDefault();

    const delta = e.deltaY;
    const step = 0.08; // smooth
    const next = delta > 0 ? zoom - step : zoom + step;
    setZoom(next, 'light');
  };

  // Mobile: pinch zoom
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    // Needed so pinch works without the browser eating it
    // (and to keep Telegram WebView calm)
    (el.style as any).touchAction = 'none';

    const dist = (t1: Touch, t2: Touch) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (ev: TouchEvent) => {
      if (!photoUrl) return;

      if (ev.touches.length === 2) {
        ev.preventDefault();
        const d = dist(ev.touches[0], ev.touches[1]);
        pinchRef.current.active = true;
        pinchRef.current.startDist = d;
        pinchRef.current.startZoom = zoom;
        haptic('light');
        return;
      }

      // 1 finger: set center
      if (ev.touches.length === 1) {
        const t = ev.touches[0];
        setCenterFromPoint(t.clientX, t.clientY);
        haptic('light');
      }
    };

    const onTouchMove = (ev: TouchEvent) => {
      if (!photoUrl) return;

      if (pinchRef.current.active && ev.touches.length === 2) {
        ev.preventDefault();
        const d = dist(ev.touches[0], ev.touches[1]);
        const ratio = d / (pinchRef.current.startDist || d);
        const next = pinchRef.current.startZoom * ratio;
        setZoom(next, 'light');
      }
    };

    const onTouchEnd = () => {
      pinchRef.current.active = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart as any);
      el.removeEventListener('touchmove', onTouchMove as any);
      el.removeEventListener('touchend', onTouchEnd as any);
      el.removeEventListener('touchcancel', onTouchEnd as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUrl, zoom]);

  const save = async () => {
    if (!crop || saving) return;
    haptic('medium');

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/doctors/${encodeURIComponent(doctorId)}/thumbnail`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // отправляем и zoom тоже — сервер может пока игнорировать, но фронту не мешает
        body: JSON.stringify({ x, y, zoom }),
      });

      const j = await res.json().catch(() => ({} as any));
      if (!res.ok || !j?.ok) {
        const msg = j?.hint || j?.error || `Ошибка сохранения (${res.status})`;
        try {
          (window as any)?.Telegram?.WebApp?.showAlert?.(msg);
        } catch {
          alert(msg);
        }
        haptic('light');
        return;
      }

      try {
        (window as any)?.Telegram?.WebApp?.showAlert?.('Миниатюра сохранена ✅');
      } catch {}
      haptic('light');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setCrop({ x: 50, y: 50, zoom: 1 });
    haptic('light');
  };

  const zoomPct = Math.round(((zoom - 1) / (3 - 1)) * 100);

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontWeight: 900, marginBottom: 6 }}>Миниатюра профиля</div>

      {photoUrl ? (
        <>
          <div
            ref={boxRef}
            onClick={onPick}
            onWheel={onWheel}
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
                // вместо objectFit даём ручной масштаб
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
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
            <div
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
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
          </div>

          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
            Кликни/тапни по фото — это будет центр миниатюры. На телефоне можно щипком (pinch) зумить.
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#111827' }}>Масштаб</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>{zoom.toFixed(2)}×</div>
            </div>

            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value), 'light')}
              style={{ width: '100%', marginTop: 8 }}
              aria-label="Zoom"
            />

            <div style={{ marginTop: 6, fontSize: 11, opacity: 0.65 }}>
              {zoomPct}% (1.00× — 3.00×)
            </div>
          </div>

          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              style={{
                border: 0,
                borderRadius: 12,
                padding: '10px 10px',
                fontWeight: 900,
                cursor: saving ? 'default' : 'pointer',
                background: '#24c768',
                color: '#fff',
                opacity: saving ? 0.65 : 1,
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
