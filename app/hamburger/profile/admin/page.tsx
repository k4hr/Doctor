/* path: app/hamburger/profile/admin/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../components/TopBarBack';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

/* -------- cookie helpers (как в профиле) -------- */
function setCookie(name: string, value: string, days = 3) {
  try {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
      value
    )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  } catch {}
}

function getCookie(name: string): string {
  try {
    const rows = document.cookie ? document.cookie.split('; ') : [];
    for (const row of rows) {
      const [k, ...rest] = row.split('=');
      if (decodeURIComponent(k) === name) return decodeURIComponent(rest.join('='));
    }
  } catch {}
  return '';
}

function getInitDataFromCookie(): string {
  return getCookie('tg_init_data');
}
/* ---------------------------------------------- */

type TgUser = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

type MeOk = { ok: true; user: TgUser; isAdmin: boolean; via: string };
type MeErr = { ok: false; error: string; hint?: string };
type MeResponse = MeOk | MeErr;

function getDisplayName(u: TgUser | null): string {
  const first = (u?.first_name || '').trim();
  const last = (u?.last_name || '').trim();
  const user = (u?.username || '').trim();
  if (first || last) return [first, last].filter(Boolean).join(' ');
  if (user) return `@${user}`;
  return 'пользователь';
}

export default function AdminMenuPage() {
  const router = useRouter();

  const [tgUser, setTgUser] = useState<TgUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');

  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;

    try {
      WebApp?.ready?.();
    } catch {}

    // UI-источник (быстрое имя)
    const unsafe = WebApp?.initDataUnsafe?.user || null;
    if (unsafe) {
      setTgUser({
        id: unsafe?.id ? String(unsafe.id) : '',
        username: unsafe?.username ? String(unsafe.username) : null,
        first_name: unsafe?.first_name ? String(unsafe.first_name) : null,
        last_name: unsafe?.last_name ? String(unsafe.last_name) : null,
      });
    }

    const initData = (WebApp?.initData as string) || getInitDataFromCookie();

    if (WebApp?.initData && typeof WebApp.initData === 'string' && WebApp.initData.length > 0) {
      setCookie('tg_init_data', WebApp.initData, 3);
    }

    (async () => {
      try {
        setLoading(true);

        if (!initData) {
          setWarn('Нет initData от Telegram — админ-меню недоступно в этом режиме.');
          setIsAdmin(false);
          return;
        }

        const res = await fetch('/api/me', {
          method: 'POST',
          headers: {
            'X-Telegram-Init-Data': initData,
            'X-Init-Data': initData,
          },
          cache: 'no-store',
        });

        const j = (await res.json().catch(() => null)) as MeResponse | null;

        if (!res.ok || !j || (j as any).ok !== true) {
          setWarn((j as any)?.hint || (j as any)?.error || 'Не удалось определить пользователя');
          setIsAdmin(false);
          return;
        }

        const ok = j as MeOk;
        setTgUser(ok.user);
        setIsAdmin(!!ok.isAdmin);
        setWarn(ok.isAdmin ? '' : 'У вас нет прав администратора.');
      } catch (e) {
        console.error(e);
        setWarn('Ошибка запроса /api/me');
        setIsAdmin(false);
      } finally {
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
    <main className="admin">
      <TopBarBack />

      <h1 className="admin-title">Админ-меню</h1>

      <p className="admin-sub">
        {loading ? (
          <>
            Проверка доступа… <span className="admin-name">...</span>
          </>
        ) : (
          <>
            Вы вошли как <span className="admin-name">{displayName}</span>
          </>
        )}
      </p>

      {warn && <p className="warn">{warn}</p>}

      {/* Показываем пункты только админу */}
      {isAdmin && (
        <section className="card">
          <button type="button" className="item" onClick={() => go('/hamburger/admin/doctors')}>
            <span className="item-title">Врачи</span>
            <span className="item-sub">Анкеты, статусы, модерация</span>
          </button>

          <button type="button" className="item" onClick={() => go('/hamburger/admin/users')}>
            <span className="item-title">Пользователи</span>
            <span className="item-sub">Список, поиск, доступы</span>
          </button>

          <button type="button" className="item" onClick={() => go('/hamburger/admin/transactions')}>
            <span className="item-title">Транзакции</span>
            <span className="item-sub">Платежи, списания, история</span>
          </button>
        </section>
      )}

      <style jsx>{`
        .admin {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        .admin-title {
          margin: 6px 0 0;
          font-size: 24px;
          font-weight: 900;
          color: #111827;
        }

        .admin-sub {
          margin: 6px 0 12px;
          font-size: 13px;
          line-height: 1.45;
          color: #374151;
        }

        .admin-name {
          font-weight: 900;
          color: #111827;
        }

        .warn {
          margin: 0 0 12px;
          font-size: 12px;
          line-height: 1.35;
          color: #ef4444;
        }

        .card {
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

        .item {
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

        .item:active {
          transform: scale(0.99);
          opacity: 0.95;
        }

        .item-title {
          font-size: 15px;
          font-weight: 900;
          color: #111827;
        }

        .item-sub {
          font-size: 12px;
          color: #6b7280;
        }
      `}</style>
    </main>
  );
}
