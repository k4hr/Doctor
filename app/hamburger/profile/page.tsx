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

type TgUserUnsafe = {
  id?: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

function getTgUserFromInitData(): TgUserUnsafe | null {
  try {
    const initData = (window as any)?.Telegram?.WebApp?.initData as
      | string
      | undefined;

    if (!initData) return null;

    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (!userStr) return null;

    const u = JSON.parse(userStr);
    return u || null;
  } catch {
    return null;
  }
}

function getTgUserUnsafe(): TgUserUnsafe | null {
  try {
    // 1) быстрый путь
    const u = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user;
    if (u) return u;

    // 2) запасной путь — парсим initData
    return getTgUserFromInitData();
  } catch {
    return getTgUserFromInitData();
  }
}

function getDisplayName(u: TgUserUnsafe | null): string {
  const first = (u?.first_name || '').trim();
  const last = (u?.last_name || '').trim();
  const user = (u?.username || '').trim();

  if (first || last) return [first, last].filter(Boolean).join(' ');
  if (user) return `@${user}`;

  return 'пользователь';
}

function isAdminTelegramId(id: string): boolean {
  // В .env задай:
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
  const [tgUser, setTgUser] = useState<TgUserUnsafe | null>(null);

  useEffect(() => {
    setTgUser(getTgUserUnsafe());
  }, []);

  const displayName = useMemo(() => getDisplayName(tgUser), [tgUser]);

  const telegramId = useMemo(() => {
    const v = tgUser?.id;
    if (v === undefined || v === null) return '';
    return String(v);
  }, [tgUser]);

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
        Здравствуйте <span className="profile-name">{displayName}</span>
      </p>

      {/* быстрые действия */}
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

      {/* админ-меню (видно только admin id) */}
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
          margin: 6px 0 12px;
          font-size: 14px;
          line-height: 1.45;
          color: #374151;
        }

        .profile-name {
          font-weight: 800;
          color: #111827;
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
