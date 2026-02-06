/* path: components/DoctorCard/DoctorCard.tsx */
'use client';

import React, { useMemo } from 'react';

export type DoctorAvatarCrop = {
  // x/y — проценты (0..100) для object-position
  x: number;
  y: number;
};

export type DoctorCardData = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;

  speciality1?: string | null;
  speciality2?: string | null;
  speciality3?: string | null;

  experienceYears?: number | null;

  avatarUrl?: string | null;
  avatarCrop?: DoctorAvatarCrop | null;
};

type Props = {
  doctor: DoctorCardData;

  variant?: 'green'; // пока один стиль, чтобы не плодить
  disabled?: boolean;

  onClick?: () => void;

  showRating?: boolean;
  ratingLabel?: string; // например "⭐ 5.0"
  rightBadge?: React.ReactNode; // если захочешь справа бейдж

  className?: string;
};

function safeStr(v: any) {
  return String(v ?? '').trim();
}

function nameLastFirst(d: DoctorCardData) {
  const ln = safeStr(d.lastName);
  const fn = safeStr(d.firstName);
  const full = [ln, fn].filter(Boolean).join(' ').trim();
  return full || 'Врач';
}

function specLine(d: DoctorCardData) {
  const parts = [d.speciality1, d.speciality2, d.speciality3]
    .filter(Boolean)
    .map((x) => safeStr(x))
    .filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

function expLabel(d: DoctorCardData) {
  const n = typeof d.experienceYears === 'number' && Number.isFinite(d.experienceYears) ? d.experienceYears : null;
  return n != null ? `Стаж: ${n} лет` : 'Стаж: —';
}

function avatarLetter(d: DoctorCardData) {
  const ln = safeStr(d.lastName);
  const fn = safeStr(d.firstName);
  const ch = (ln || fn || 'D')[0] || 'D';
  return ch.toUpperCase();
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function DoctorCard({
  doctor,
  variant = 'green',
  disabled = false,
  onClick,
  showRating = true,
  ratingLabel = '⭐ 5.0',
  rightBadge,
  className = '',
}: Props) {
  const cropStyle = useMemo(() => {
    const c = doctor.avatarCrop;
    if (!c || typeof c !== 'object') return undefined;
    const x = clamp(Number((c as any).x), 0, 100);
    const y = clamp(Number((c as any).y), 0, 100);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
    return { objectPosition: `${x}% ${y}%` } as React.CSSProperties;
  }, [doctor.avatarCrop]);

  const isClickable = !disabled && typeof onClick === 'function';

  return (
    <>
      <button
        type="button"
        className={[
          'doccard',
          variant === 'green' ? 'doccard--green' : '',
          disabled ? 'doccard--disabled' : '',
          className,
        ].filter(Boolean).join(' ')}
        onClick={isClickable ? onClick : undefined}
        disabled={disabled}
      >
        <div className="doccard-avatar" aria-label="Аватар врача">
          {doctor.avatarUrl && !disabled ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doctor.avatarUrl} alt="doctor" className="doccard-avatar-img" style={cropStyle} />
          ) : (
            <span>{avatarLetter(doctor)}</span>
          )}
        </div>

        <div className="doccard-main">
          <div className="doccard-name-row">
            <span className="doccard-name" title={nameLastFirst(doctor)}>
              {nameLastFirst(doctor)}
            </span>
            {rightBadge ? <span className="doccard-right">{rightBadge}</span> : null}
          </div>

          <span className="doccard-spec" title={specLine(doctor)}>
            {specLine(doctor)}
          </span>

          <div className="doccard-bottom">
            <span className="doccard-exp">{expLabel(doctor)}</span>
            {showRating ? <span className="doccard-rating">{ratingLabel}</span> : null}
          </div>
        </div>
      </button>

      <style jsx>{`
        .doccard {
          padding: 10px 12px;
          border-radius: 16px;
          border: 1px solid rgba(34, 197, 94, 0.22);
          background: rgba(220, 252, 231, 0.75);
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.16);
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          text-align: left;
          min-width: 0;
          overflow: hidden;
          width: 100%;
        }

        .doccard--disabled {
          cursor: default;
          opacity: 0.6;
        }

        .doccard:active {
          transform: translateY(1px);
          box-shadow: 0 6px 16px rgba(22, 163, 74, 0.24);
        }

        .doccard--disabled:active {
          transform: none;
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.16);
        }

        .doccard-avatar {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          color: #16a34a;
          box-shadow: 0 4px 10px rgba(22, 163, 74, 0.3);
          flex-shrink: 0;
          overflow: hidden;
        }

        .doccard-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          object-position: 50% 50%;
        }

        .doccard-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          overflow: hidden;
        }

        .doccard-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-width: 0;
        }

        .doccard-name {
          font-size: 14px;
          font-weight: 700;
          color: #022c22;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
          max-width: 100%;
        }

        .doccard-right {
          flex: 0 0 auto;
          white-space: nowrap;
        }

        .doccard-spec {
          font-size: 12px;
          color: rgba(15, 23, 42, 0.8);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
          max-width: 100%;
        }

        .doccard-bottom {
          margin-top: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          gap: 10px;
          min-width: 0;
        }

        .doccard-exp {
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.9);
          color: #15803d;
          font-weight: 500;
          white-space: nowrap;
          flex: 0 0 auto;
        }

        .doccard-rating {
          color: #166534;
          font-weight: 600;
          white-space: nowrap;
          flex: 0 0 auto;
        }
      `}</style>
    </>
  );
}
