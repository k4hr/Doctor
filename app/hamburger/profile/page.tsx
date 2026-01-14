/* path: app/hamburger/profile/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../components/TopBarBack';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

type TgUser = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

type TgUserUnsafe = {
  id?: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

type MeResponse =
  | { ok: true; user: TgUser; doctor: { id: string; status: string } | null }
  | { ok: false; error: string; hint?: string };

function getTelegramInitData(): string {
  try {
    return (window as any)?.Telegram?.WebApp?.initData || '';
  } catch {
    return '';
  }
}

function getTgUserUnsafe(): TgUserUnsafe | null {
  try {
    return (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user || null;
  } catch {
    return null;
  }
}

function normalizeUnsafe(u: TgUserUnsafe | null): TgUser | null {
  if (!u) return null;
  const id = u.id === undefined || u.id === null ? '' : String(u.id);
  if (!id) return null;

  return {
    id,
    username: u.username ? String(u.username) : null,
    first_name: u.first_name ? String(u.first_name) : null,
    last_name: u.last_name ? String(u.last_name) : null,
  };
}

// ✅ Приоритет: @username → first last → пользователь
function getDisplayName(u: TgUser | null): string {
  const user = (u?.username || '').trim();
  const first = (u?.first_name || '').trim();
  const last = (u?.last_name || '').trim();

  if (user) return `@${user}`;
  if (first || last) return [first, last].filter(Boolean).join(' ');
  return 'пользователь';
}

function isAdminTelegramId(id: string): boolean {
  // .env:
  // NEXT_PUBLIC_ADMIN_TELEGRAM_IDS="123,456,789"
  const raw = (process.env.NEXT_PUBLIC_ADMIN_TELEGRAM_IDS || '').trim();
  if (!raw) return false;

  const set = new Set(
    raw
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
  );
  return set.has(id);
}

export default function ProfilePage() {
  const router = useRouter();

  const [tgUser, setTgUser] = useState<TgUser | null>(null);
  const [doctorStatus, setDoctorStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) Сразу пробуем взять имя локально (чтобы не было "пользователь")
    const unsafeUser = normalizeUnsafe(getTgUserUnsafe());
    if (unsafeUser) setTgUser(unsafeUser);

    try {
      (window as any)?.Telegram?.WebApp?.ready?.();
    } catch {}

    // 2) Потом подтягиваем с сервера (проверка подписи + статус анкеты)
    const initData = getTelegramInitData();
    if (!initData) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        });

        const j = (await res.json().catch(() => null)) as MeResponse | null;

        if (!res.ok || !j || (j as any).ok !== true) {
          setLoading(false);
          return;
        }

        setTgUser(j.user);
        setDoctorStatus(j.doctor?.status ?? null);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    })();
  }, []);

  const displayName = useMemo(() => getDisplayName(tgUser), [tgUser]);
  const telegramId = useMemo(() => (tgUser?.id ? String(tgUser.id) : ''), [tgUser]);

  const isAdmin = useMemo(
    () => (telegramId ? isAdminTelegramId(telegramId) : false),
    [telegramId]
  );

  const go = (path: string) => {
    haptic('light');
    router.push(path);
  };

  return (
    <main className="profile">
      <TopBarBack />

      <h1 className="profile-title">Мой профиль</h1>

      <p className="profile-hello">
        Здравствуйте{' '}
        <span className="profile-name">{loading && !tgUser ? '...' : displayName}</span>
      </p>

      {doctorStatus && (
        <p className="profile-status">
          Статус анкеты врача: <b>{doctorStatus}</b>
        </p>
      )}

      <section className="profile-card">
        <button
          type="button"
          className="profile-btn"
          onClick={() => go('/hamburger/questions')}
        >
          <span className="profile-btn-title">Вопросы</span>
          <span className="profile-btn-sub">Актуальные и архив</span>
        </button>

        <button
          type="button"
          className="profile-btn"
          onClick={() => go('/hamburger/consultations')}
        >
          <span className="profile-btn-title">Консультации</span>
          <span className="profile-btn-sub">Ваши консультации</span>
        </button>

        <button
          type="button"
          className="profile-btn"
          onClick={() => go('/hamburger/history')}
        >
          <span className="profile-btn-title">История операций</span>
          <span className="profile-btn-sub">Платежи и списания</span>
        </button>

        <button
          type="button"
          className="profile-btn"
          onClick={() => go('/hamburger/profile/edit')}
        >
          <span className="profile-btn-title">Редактирование профиля</span>
          <span className="profile-btn-sub">Данные и настройки</span>
        </button>
      </section>

      {isAdmin && (
        <section className="profile-card admin">
          <h2 className="profile-card-title">Админ-меню</h2>

          <button
            type="button"
            className="profile-btn adminBtn"
            onClick={() => go('/hamburger/admin/doctors')}
          >
            <span className="profile-btn-title">Анкеты врачей на проверку</span>
            <span className="profile-btn-sub">Модерация и статусы</span>
          </button>

          <p className="adminHint">
            Админ-доступ включается через переменную{' '}
            <span className="mono">NEXT_PUBLIC_ADMIN_TELEGRAM_IDS</span>.
          </p>
        </section>
      )}

      <style jsx>{`
        .profile {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        .profile-title {
          margin: 6px 0 0;
          font-size: 24px;
          font-weight: 900;
          color: #111827;
        }

        .profile-hello {
          margin: 6px 0 6px;
          font-size: 14px;
          line-height: 1.45;
          color: #374151;
        }

        .profile-name {
          font-weight: 800;
          color: #111827;
        }

        .profile-status {
          margin: 0 0 12px;
          font-size: 12px;
          color: #6b7280;
        }

        .profile-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 12px;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
          border: 1px solid rgba(15, 23, 42, 0.04);
          width: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .profile-card.admin {
          margin-top: 14px;
          padding: 14px 12px 12px;
        }

        .profile-card-title {
          margin: 0 0 4px;
          font-size: 16px;
          font-weight: 900;
          color: #111827;
        }

        .profile-btn {
          width: 100%;
          text-align: left;
          border: 1px solid rgba(156, 163, 175, 0.45);
          background: #ffffff;
          border-radius: 14px;
          padding: 12px 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .profile-btn:active {
          transform: scale(0.99);
          opacity: 0.95;
        }

        .profile-btn-title {
          font-size: 15px;
          font-weight: 900;
          color: #111827;
        }

        .profile-btn-sub {
          font-size: 12px;
          color: #6b7280;
        }

        .adminBtn {
          border-color: rgba(37, 99, 235, 0.35);
        }

        .adminHint {
          margin: 2px 2px 0;
          font-size: 11px;
          color: #9ca3af;
          line-height: 1.35;
        }

        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            'Liberation Mono', 'Courier New', monospace;
          font-size: 11px;
          color: #6b7280;
        }
      `}</style>
    </main>
  );
}
