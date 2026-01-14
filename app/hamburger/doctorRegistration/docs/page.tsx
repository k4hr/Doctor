'use client';

import { useMemo, useState } from 'react';
import TopBarBack from '../../../../components/TopBarBack';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

function getTelegramInitData(): string {
  try {
    return (window as any)?.Telegram?.WebApp?.initData || '';
  } catch {
    return '';
  }
}

export default function DoctorDocsPage() {
  const [profile, setProfile] = useState<File | null>(null);
  const [diploma, setDiploma] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const profileUrl = useMemo(
    () => (profile ? URL.createObjectURL(profile) : ''),
    [profile]
  );
  const diplomaUrl = useMemo(
    () => (diploma ? URL.createObjectURL(diploma) : ''),
    [diploma]
  );

  const upload = async () => {
    haptic('medium');

    const initData = getTelegramInitData();
    if (!initData) {
      const msg =
        'Не удалось получить данные Telegram. Откройте страницу через Telegram (WebApp).';
      try {
        (window as any)?.Telegram?.WebApp?.showAlert?.(msg);
      } catch {
        alert(msg);
      }
      return;
    }

    if (!profile || !diploma) {
      const msg = 'Загрузите фото профиля и фото диплома.';
      try {
        (window as any)?.Telegram?.WebApp?.showAlert?.(msg);
      } catch {
        alert(msg);
      }
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('initData', initData);
      fd.append('profilePhoto', profile);
      fd.append('diplomaPhoto', diploma);

      const res = await fetch('/api/doctor/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg =
          j?.error === 'BAD_HASH'
            ? 'Ошибка проверки Telegram (BAD_HASH). Проверь TELEGRAM_BOT_TOKEN на сервере.'
            : 'Ошибка загрузки документов. Попробуйте ещё раз.';
        try {
          (window as any)?.Telegram?.WebApp?.showAlert?.(msg);
        } catch {
          alert(msg);
        }
        return;
      }

      try {
        (window as any)?.Telegram?.WebApp?.showAlert?.(
          'Документы загружены. Профиль отправлен на модерацию.'
        );
      } catch {
        alert('Документы загружены. Профиль отправлен на модерацию.');
      }
    } catch (e) {
      console.error(e);
      const msg = 'Сеть/сервер недоступны. Попробуйте позже.';
      try {
        (window as any)?.Telegram?.WebApp?.showAlert?.(msg);
      } catch {
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="docs">
      <TopBarBack />

      <h1 className="docs-title">Фото и документы</h1>
      <p className="docs-sub">
        Загрузите фото профиля и фото диплома. Это нужно для модерации и доверия
        пациентов.
      </p>

      <section className="card">
        <h2 className="card-title">Фото профиля</h2>

        {profileUrl ? (
          <img className="preview" src={profileUrl} alt="preview profile" />
        ) : (
          <div className="placeholder">Фото не выбрано</div>
        )}

        <input
          className="file"
          type="file"
          accept="image/*"
          onChange={(e) => setProfile(e.target.files?.[0] || null)}
        />
        <p className="hint">Рекомендуется портрет, хорошее освещение.</p>
      </section>

      <section className="card">
        <h2 className="card-title">Фото диплома</h2>

        {diplomaUrl ? (
          <img className="preview" src={diplomaUrl} alt="preview diploma" />
        ) : (
          <div className="placeholder">Диплом не выбран</div>
        )}

        <input
          className="file"
          type="file"
          accept="image/*"
          onChange={(e) => setDiploma(e.target.files?.[0] || null)}
        />
        <p className="hint">Фото должно быть читаемым: ФИО, ВУЗ, дата.</p>
      </section>

      <button className="btn" type="button" disabled={loading} onClick={upload}>
        {loading ? 'Загрузка…' : 'Отправить на модерацию'}
      </button>

      <style jsx>{`
        .docs {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        .docs-title {
          margin: 4px 0 0;
          font-size: 24px;
          font-weight: 900;
          color: #111827;
        }

        .docs-sub {
          margin: 6px 0 12px;
          font-size: 13px;
          line-height: 1.5;
          color: #6b7280;
        }

        .card {
          background: #fff;
          border-radius: 18px;
          padding: 16px 14px 14px;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
          border: 1px solid rgba(15, 23, 42, 0.04);
          margin-bottom: 12px;
        }

        .card-title {
          margin: 0 0 10px;
          font-size: 16px;
          font-weight: 800;
          color: #111827;
        }

        .preview {
          width: 100%;
          height: auto;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          display: block;
          margin-bottom: 10px;
        }

        .placeholder {
          width: 100%;
          height: 180px;
          border-radius: 14px;
          border: 1px dashed rgba(156, 163, 175, 0.8);
          display: grid;
          place-items: center;
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 10px;
          background: #fafafa;
        }

        .file {
          width: 100%;
        }

        .hint {
          margin: 8px 0 0;
          font-size: 11px;
          color: #9ca3af;
        }

        .btn {
          margin-top: 6px;
          width: 100%;
          padding: 14px 16px;
          border-radius: 999px;
          border: none;
          background: #24c768;
          color: #fff;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(36, 199, 104, 0.35);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </main>
  );
}
