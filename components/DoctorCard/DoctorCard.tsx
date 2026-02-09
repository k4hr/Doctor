/* path: components/DoctorCard/DoctorCard.tsx */
'use client';

import React, { useMemo } from 'react';

export type DoctorCardItem = {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  city: string | null;
  speciality1: string;
  speciality2: string | null;
  speciality3: string | null;
  experienceYears: number | null;
  avatarUrl: string | null;
};

type Props = {
  doctor: DoctorCardItem;
  onClick?: (doctor: DoctorCardItem) => void;
  ratingLabel?: string; // строка "5.0" и т.п.
};

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

function doctorFullName(d: DoctorCardItem) {
  const ln = String(d?.lastName || '').trim();
  const fn = String(d?.firstName || '').trim();
  const mn = String(d?.middleName || '').trim();
  return [ln, fn, mn].filter(Boolean).join(' ').trim() || '—';
}

function doctorSpecsLine(d: DoctorCardItem) {
  const parts = [d?.speciality1, d?.speciality2, d?.speciality3].filter(Boolean).map((x) => String(x).trim());
  return parts.length ? parts.join(', ') : '—';
}

function doctorAvatarLetter(d: DoctorCardItem) {
  const n = String(d?.lastName || d?.firstName || 'D').trim();
  return (n[0] || 'D').toUpperCase();
}

export default function DoctorCard({ doctor, onClick, ratingLabel = '⭐ 5.0' }: Props) {
  const name = useMemo(() => doctorFullName(doctor), [doctor]);
  const spec = useMemo(() => doctorSpecsLine(doctor), [doctor]);

  const exp =
    typeof doctor.experienceYears === 'number' && Number.isFinite(doctor.experienceYears)
      ? doctor.experienceYears
      : null;
  const expLabel = exp !== null ? `Стаж: ${exp} лет` : 'Стаж: —';

  return (
    <>
      <button
        type="button"
        className="doconline-card"
        onClick={() => {
          haptic('light');
          onClick?.(doctor);
        }}
      >
        <div className="doconline-avatar" aria-label="Фото врача">
          {doctor.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doctor.avatarUrl} alt="" />
          ) : (
            <span>{doctorAvatarLetter(doctor)}</span>
          )}
        </div>

        <div className="doconline-main">
          <div className="doconline-name-row">
            <span className="doconline-name">{name}</span>
          </div>

          <span className="doconline-spec">{spec}</span>

          <div className="doconline-bottom">
            <span className="doconline-exp">{expLabel}</span>
            <span className="doconline-rating">{ratingLabel}</span>
          </div>
        </div>
      </button>

      <style jsx>{`
        .doconline-card {
          width: 100%;
          box-sizing: border-box;

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
        }

        .doconline-card:active {
          transform: translateY(1px);
          box-shadow: 0 6px 16px rgba(22, 163, 74, 0.24);
        }

        .doconline-avatar {
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

        .doconline-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .doconline-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .doconline-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-width: 0;
        }

        .doconline-name {
          font-size: 14px;
          font-weight: 700;
          color: #022c22;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .doconline-spec {
          font-size: 12px;
          color: rgba(15, 23, 42, 0.8);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .doconline-bottom {
          margin-top: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          gap: 10px;
        }

        .doconline-exp {
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.9);
          color: #15803d;
          font-weight: 500;
          white-space: nowrap;
        }

        .doconline-rating {
          color: #166534;
          font-weight: 600;
          white-space: nowrap;
        }
      `}</style>
    </>
  );
}
