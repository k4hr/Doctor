/* path: app/vopros/[id]/PhotoLightbox.tsx */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  urls: string[];
};

type Pt = { x: number; y: number };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function PhotoLightbox({ urls }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // zoom state
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const pointersRef = useRef<Map<number, Pt>>(new Map());
  const gestureRef = useRef<{
    mode: 'none' | 'pan' | 'pinch';
    startScale: number;
    startTx: number;
    startTy: number;
    startDist: number;
    startMid: Pt;
    lastTapTs: number;
    lastTapPt: Pt | null;
  }>({
    mode: 'none',
    startScale: 1,
    startTx: 0,
    startTy: 0,
    startDist: 0,
    startMid: { x: 0, y: 0 },
    lastTapTs: 0,
    lastTapPt: null,
  });

  // размеры “вписанного” изображения при scale=1 (contain)
  const fitRef = useRef<{ fitW: number; fitH: number; boxW: number; boxH: number } | null>(null);

  const has = useMemo(() => Array.isArray(urls) && urls.length > 0, [urls]);

  const close = () => setOpen(false);

  const resetZoom = () => {
    setScale(1);
    setTx(0);
    setTy(0);
    gestureRef.current.mode = 'none';
    pointersRef.current.clear();
  };

  const computeFit = () => {
    const box = stageRef.current;
    const img = imgRef.current;
    if (!box || !img) return;

    const rect = box.getBoundingClientRect();
    const boxW = rect.width;
    const boxH = rect.height;

    const nw = img.naturalWidth || 0;
    const nh = img.naturalHeight || 0;
    if (!nw || !nh || !boxW || !boxH) return;

    const ratio = nw / nh;

    let fitW = boxW;
    let fitH = fitW / ratio;

    if (fitH > boxH) {
      fitH = boxH;
      fitW = fitH * ratio;
    }

    fitRef.current = { fitW, fitH, boxW, boxH };
  };

  const clampTranslateFor = (nextScale: number, nextTx: number, nextTy: number) => {
    const f = fitRef.current;
    if (!f) return { tx: nextTx, ty: nextTy };

    const dispW = f.fitW * nextScale;
    const dispH = f.fitH * nextScale;

    const maxTx = Math.max(0, (dispW - f.boxW) / 2);
    const maxTy = Math.max(0, (dispH - f.boxH) / 2);

    return {
      tx: clamp(nextTx, -maxTx, maxTx),
      ty: clamp(nextTy, -maxTy, maxTy),
    };
  };

  const setZoom = (nextScale: number, nextTx: number, nextTy: number) => {
    const s = clamp(nextScale, 1, 6); // максимум (можешь поставить 8)
    const cl = clampTranslateFor(s, nextTx, nextTy);
    setScale(s);
    setTx(cl.tx);
    setTy(cl.ty);
  };

  const getPointInStage = (clientX: number, clientY: number): Pt => {
    const el = stageRef.current;
    if (!el) return { x: clientX, y: clientY };
    const r = el.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  // открытие/закрытие + блок скролла
  useEffect(() => {
    if (!open) return;

    resetZoom();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setActive((x) => Math.min(x + 1, urls.length - 1));
      if (e.key === 'ArrowLeft') setActive((x) => Math.max(x - 1, 0));
    };

    window.addEventListener('keydown', onKey);

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [open, urls.length]);

  // пересчитать fit на ресайзе/ориентации
  useEffect(() => {
    if (!open) return;

    const onResize = () => {
      computeFit();
      setZoom(scale, tx, ty);
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize as any);

    const t = setTimeout(() => onResize(), 80);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // смена картинки — сброс
  useEffect(() => {
    if (!open) return;
    resetZoom();
  }, [active, open]);

  if (!has) return null;

  return (
    <>
      <div className="grid">
        {urls.map((u, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={u}
            src={u}
            alt="photo"
            className="thumb"
            onClick={() => {
              setActive(idx);
              setOpen(true);
            }}
          />
        ))}
      </div>

      {open ? (
        <div
          className="overlay"
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фотографии"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <button className="close" type="button" onClick={close} aria-label="Закрыть">
            ✕
          </button>

          <div className="counter">
            {active + 1} / {urls.length}
          </div>

          <div
            ref={stageRef}
            className="stage"
            onPointerDown={(e) => {
              const now = Date.now();
              const pt = getPointInStage(e.clientX, e.clientY);
              const g = gestureRef.current;

              const isDoubleTap =
                now - g.lastTapTs < 280 &&
                g.lastTapPt &&
                Math.hypot(pt.x - g.lastTapPt.x, pt.y - g.lastTapPt.y) < 28;

              g.lastTapTs = now;
              g.lastTapPt = pt;

              (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
              pointersRef.current.set(e.pointerId, pt);

              const pts = Array.from(pointersRef.current.values());

              if (isDoubleTap) {
                if (scale <= 1.02) {
                  // телеграм-стайл: двойной тап -> 2x по центру
                  setZoom(2, 0, 0);
                } else {
                  resetZoom();
                }
                e.preventDefault();
                return;
              }

              if (pts.length === 1) {
                gestureRef.current.mode = 'pan';
                gestureRef.current.startScale = scale;
                gestureRef.current.startTx = tx;
                gestureRef.current.startTy = ty;
                gestureRef.current.startMid = pts[0];
              } else if (pts.length >= 2) {
                const a = pts[0];
                const b = pts[1];
                gestureRef.current.mode = 'pinch';
                gestureRef.current.startScale = scale;
                gestureRef.current.startTx = tx;
                gestureRef.current.startTy = ty;
                gestureRef.current.startDist = dist(a, b);
                gestureRef.current.startMid = mid(a, b);
              }

              e.preventDefault();
            }}
            onPointerMove={(e) => {
              const pt = getPointInStage(e.clientX, e.clientY);
              if (!pointersRef.current.has(e.pointerId)) return;

              pointersRef.current.set(e.pointerId, pt);

              const pts = Array.from(pointersRef.current.values());
              const g = gestureRef.current;

              if (pts.length >= 2) {
                const a = pts[0];
                const b = pts[1];
                const d = dist(a, b);
                const m = mid(a, b);

                const baseDist = g.startDist || 1;
                const nextScale = g.startScale * (d / baseDist);

                const dx = m.x - g.startMid.x;
                const dy = m.y - g.startMid.y;

                setZoom(nextScale, g.startTx + dx, g.startTy + dy);
              } else if (pts.length === 1) {
                if (scale <= 1.02) return;

                const p = pts[0];
                const dx = p.x - g.startMid.x;
                const dy = p.y - g.startMid.y;

                setZoom(scale, g.startTx + dx, g.startTy + dy);
              }

              e.preventDefault();
            }}
            onPointerUp={(e) => {
              pointersRef.current.delete(e.pointerId);
              const pts = Array.from(pointersRef.current.values());

              if (pts.length === 1) {
                const p = pts[0];
                gestureRef.current.mode = 'pan';
                gestureRef.current.startScale = scale;
                gestureRef.current.startTx = tx;
                gestureRef.current.startTy = ty;
                gestureRef.current.startMid = p;
              } else {
                gestureRef.current.mode = 'none';
              }
            }}
            onPointerCancel={(e) => {
              pointersRef.current.delete(e.pointerId);
              gestureRef.current.mode = 'none';
            }}
            onWheel={(e) => {
              e.preventDefault();

              const delta = e.deltaY;
              const zoomFactor = delta > 0 ? 0.92 : 1.08;

              const nextScale = clamp(scale * zoomFactor, 1, 6);

              const f = fitRef.current;
              if (!f) {
                setZoom(nextScale, tx, ty);
                return;
              }

              const pt = getPointInStage(e.clientX, e.clientY);
              const cx = f.boxW / 2;
              const cy = f.boxH / 2;

              const rx = pt.x - cx - tx;
              const ry = pt.y - cy - ty;

              const k = nextScale / scale;

              const nextTx = tx - rx * (k - 1);
              const nextTy = ty - ry * (k - 1);

              setZoom(nextScale, nextTx, nextTy);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              className="full"
              src={urls[active]}
              alt="photo-full"
              draggable={false}
              onLoad={() => {
                computeFit();
                resetZoom();
              }}
              style={{
                transform: `translate3d(calc(-50% + ${tx}px), calc(-50% + ${ty}px), 0) scale(${scale})`,
              }}
            />
          </div>

          {urls.length > 1 ? (
            <>
              <button
                className="nav navLeft"
                type="button"
                aria-label="Предыдущая"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((x) => Math.max(x - 1, 0));
                }}
                disabled={active === 0}
              >
                ‹
              </button>

              <button
                className="nav navRight"
                type="button"
                aria-label="Следующая"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((x) => Math.min(x + 1, urls.length - 1));
                }}
                disabled={active === urls.length - 1}
              >
                ›
              </button>
            </>
          ) : null}

          {scale > 1.02 ? (
            <button className="reset" type="button" onClick={resetZoom} aria-label="Сбросить зум">
              Сброс
            </button>
          ) : null}
        </div>
      ) : null}

      <style jsx>{`
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .thumb {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #f3f4f6;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(0, 0, 0, 0.92);
        }

        /* ВАЖНО: stage = реальный контейнер для расчёта размеров/центра */
        .stage {
          position: absolute;
          inset: 0;
          overflow: hidden;
          touch-action: none;
          user-select: none;
        }

        /* Телеграм-стайл: картинка всегда anchored к центру (50/50) */
        .full {
          position: absolute;
          left: 50%;
          top: 50%;
          max-width: 100vw;
          max-height: 100vh;
          width: auto;
          height: auto;
          object-fit: contain;
          border-radius: 0; /* как в TG */
          background: transparent;
          will-change: transform;
          -webkit-user-drag: none;
          transform-origin: center center;
        }

        .close {
          position: fixed;
          top: calc(env(safe-area-inset-top, 0px) + 12px);
          right: 12px;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.10);
          color: #fff;
          font-size: 18px;
          font-weight: 900;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .counter {
          position: fixed;
          top: calc(env(safe-area-inset-top, 0px) + 18px);
          left: 12px;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: rgba(255, 255, 255, 0.92);
          font-size: 12px;
          font-weight: 800;
        }

        .reset {
          position: fixed;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
          left: 50%;
          transform: translateX(-50%);
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.10);
          color: rgba(255, 255, 255, 0.95);
          font-size: 12px;
          font-weight: 900;
          -webkit-tap-highlight-color: transparent;
          cursor: pointer;
        }

        .nav {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 54px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.10);
          color: #fff;
          font-size: 34px;
          line-height: 1;
          font-weight: 900;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .nav:disabled {
          opacity: 0.25;
          cursor: default;
        }

        .navLeft {
          left: 10px;
        }

        .navRight {
          right: 10px;
        }
      `}</style>
    </>
  );
}
