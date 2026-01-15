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

type MeOk = { ok: true; user: TgUser; isAdmin: boolean; via: string };
type MeErr = { ok: false; error: string; hint?: string };
type MeResponse = MeOk | MeErr;

function getTelegramInitData(): string {
  try {
    return (window as any)?.Telegram?.WebApp?.initData || '';
  } catch {
    return '';
  }
}

function getDisplayName(u: TgUser | null): string {
  const first = (u?.first_name || '').trim();
  const last = (u?.last_name || '').trim();
  const user = (u?.username || '').trim();
  if (first || last) return [first, last].filter(Boolean).join(' ');
  if (user) return `@${user}`;
  return 'пользователь';
}

export default function ProfilePage() {
  const router = useRouter();

  const [tgUser, setTgUser] = useState<TgUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noInitData, setNoInitData] = useState(false);

  useEffect(() => {
    try {
      (window as any)?.Telegram?.WebApp?.ready?.();
    } catch {}

    const initData = getTelegramInitData();

    // Если initData реально нет — это 99% BotFather preview / неверный запуск
    if (!initData) {
      setNoInitData(true);
      setLoading(false);

      // OPTIONAL: debug для разработки, чтобы можно было тестить админку
      // открыть страницу так: /hamburger/profile?debug=1&id=123456
      // и на сервере env: ALLOW_BROWSER_DEBUG=1
      const url = new URL(window.location.href);
      const debug = url.searchParams.get('debug') === '1';
      const id = url.searchParams.get('id');

      if (debug && id) {
        (async () => {
          try {
            const res = await fetch(`/api/me?debug=1&id=${encodeURIComponent(id)}`, {
              method: 'GET',
            });
            const j = (await res.json().catch(() => null)) as MeResponse | null;
            if (j && (j as any).ok === true) {
              setTgUser((j as MeOk).user);
              setIsAdmin((j as MeOk).isAdmin);
            }
          } catch {}
        })();
      }

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

        setTgUser((j as MeOk).user);
        setIsAdmin((j as MeOk).isAdmin);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    })();
  }, []);

  const displayName = useMemo(() => getDisplayName(tgUser), [tgUser]);

  const go = (path: string) => {
    haptic('light');
    router.push(path);
  };

  return (
    <main className="profile">
      <TopBarBack />

      <h1 className="profile-title">Мой профиль</h1>

      <p className="profile-hello">
        Здравствуйте <span className="profile-name">{loading ? '...' : displayName}</span>
      </p>

      {noInitData && (
        <p className="warn">
          Нет initData от Telegram. <br />
          Это бывает в BotFather preview/«Open App». Для реальной авторизации нужно открывать WebApp из кнопки <b>в твоём боте</b> (reply keyboard с <code>web_app</code>).
          <br />
          <span className="warnSmall">
            Для dev-теста админки можно открыть: <code>/hamburger/profile?debug=1&id=123456</code> (и включить <code>ALLOW_BROWSER_DEBUG=1</code>).
          </span>
        </p>
      )}

      <section className="profile-card">
        <button type="button" className="profile-btn" onClick={() => go('/hamburger/questions')}>
          <span className="profile-btn-title">Вопросы</span>
          <span className="profile-btn-sub">Актуальные и архив</span>
        </button>

        <button type="button" className="profile-btn" onClick={() => go('/hamburger/consultations')}>
          <span className="profile-btn-title">Консультации</span>
          <span className="profile-btn-sub">Ваши консультации</span>
        </button>

        <button type="button" className="profile-btn" onClick={() => go('/hamburger/history')}>
          <span className="profile-btn-title">История операций</span>
          <span className="profile-btn-sub">Платежи и списания</span>
        </button>

        <button type="button" className="profile-btn" onClick={() => go('/hamburger/profile/edit')}>
          <span className="profile-btn-title">Редактирование профиля</span>
          <span className="profile-btn-sub">Данные и настройки</span>
        </button>
      </section>

      {isAdmin && (
        <section className="profile-card admin">
          <h2 className="profile-card-title">Админ-меню</h2>

          <button type="button" className="profile-btn adminBtn" onClick={() => go('/hamburger/admin/doctors')}>
            <span className="profile-btn-title">Анкеты врачей на проверку</span>
            <span className="profile-btn-sub">Модерация и статусы</span>
          </button>
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
          margin: 6px 0 8px;
          font-size: 14px;
          line-height: 1.45;
          color: #374151;
        }

        .profile-name {
          font-weight: 800;
          color: #111827;
        }

        .warn {
          margin: 0 0 12px;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
        }

        .warnSmall {
          display: inline-block;
          margin-top: 6px;
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
      `}</style>
    </main>
  );
}
