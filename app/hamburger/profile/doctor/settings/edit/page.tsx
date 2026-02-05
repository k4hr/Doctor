'use client';

import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../../../components/TopBarBack';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

export default function DoctorEditPage() {
  const router = useRouter();

  return (
    <main className="page">
      <TopBarBack />

      <div className="wrap">
        <div className="title">Редактирование профиля</div>
        <div className="sub">Данные и настройки</div>

        <div className="card">
          <div className="muted">
            Сейчас редактирование у тебя фактически живёт в “Профиль врача”.
            <br />
            Могу вынести отдельную форму сюда, когда ты скажешь какие поля и какой API.
          </div>

          <button
            type="button"
            className="btn"
            onClick={() => {
              haptic('light');
              router.push('/hamburger/profile/doctor');
            }}
          >
            Открыть профиль врача
          </button>
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          background: #f6f7fb;
        }
        .wrap {
          max-width: 430px;
          margin: 0 auto;
        }
        .title {
          margin-top: 6px;
          font-size: 22px;
          font-weight: 950;
          color: #111827;
        }
        .sub {
          margin-top: 4px;
          font-size: 13px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.6);
        }
        .card {
          margin-top: 14px;
          background: #fff;
          border-radius: 18px;
          padding: 14px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
        }
        .muted {
          font-size: 13px;
          line-height: 1.45;
          color: rgba(17, 24, 39, 0.65);
          font-weight: 800;
        }
        .btn {
          margin-top: 12px;
          width: 100%;
          border: none;
          border-radius: 16px;
          padding: 12px;
          background: #24c768;
          color: #fff;
          font-size: 14px;
          font-weight: 950;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 14px 26px rgba(36, 199, 104, 0.22);
        }
        .btn:active {
          transform: scale(0.99);
          opacity: 0.96;
        }
      `}</style>
    </main>
  );
}
