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

/* -------- cookie helpers (как в старом кабинете) -------- */
function setCookie(name: string, value: string, days = 3) {
  try {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
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

function parseUserFromInitCookie(): any | null {
  try {
    const raw = getCookie('tg_init_data');
    if (!raw) return null;
    const sp = new URLSearchParams(raw);
    const u = sp.get('user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

function getInitDataFromCookie(): string {
  return getCookie('tg_init_data');
}
/* ------------------------------------------------------- */

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
  const [warn, setWarn] = useState<string>('');

  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;

    try {
      WebApp?.ready?.();
    } catch {}

    // 1) Сразу показываем имя из initDataUnsafe (это UI-источник №1)
    let unsafe = WebApp?.initDataUnsafe?.user || null;
    if (!unsafe) unsafe = parseUserFromInitCookie();
    if (unsafe) {
      const u: TgUser = {
        id: unsafe?.id ? String(unsafe.id) : '',
        username: unsafe?.username ? String(unsafe.username) : null,
        first_name: unsafe?.first_name ? String(unsafe.first_name) : null,
        last_name: unsafe?.last_name ? String(unsafe.last_name) : null,
      };
      setTgUser((prev) => prev ?? u);
    }

    // 2) initData (для сервера) — WebApp.initData, иначе cookie
    const initData = (WebApp?.initData as string) || getInitDataFromCookie();

    // ВАЖНО: если Telegram дал initData — сохраняем в cookie,
    // чтобы оно было доступно на других страницах и после навигации
    if (WebApp?.initData && typeof WebApp.initData === 'string' && WebApp.initData.length > 0) {
      setCookie('tg_init_data', WebApp.initData, 3);
    }

    (async () => {
      try {
        setLoading(true);

        // Если initData вообще нет — покажем понятное предупреждение
        if (!initData) {
          setWarn(
            'Нет initData от Telegram. Обычно это BotFather preview/неправильный запуск. ' +
              'Но если ты открываешь из бота кнопкой "Открыть" и всё равно пусто — значит Telegram не передаёт initData в этом окружении.'
          );

          // dev-фолбэк: ?id=123 при ALLOW_BROWSER_DEBUG=1
          try {
            const u = new URL(window.location.href);
            const id = u.searchParams.get('id');
            const debug = u.searchParams.get('debug') === '1';
            if (debug && id) {
              const r = await fetch(`/api/me?id=${encodeURIComponent(id)}`, {
                method: 'GET',
                cache: 'no-store',
              });
              const j = (await r.json().catch(() => null)) as MeResponse | null;
              if (j && (j as any).ok === true) {
                setTgUser((j as MeOk).user);
                setIsAdmin((j as MeOk).isAdmin);
                setWarn('');
              }
            }
          } catch {}

          return;
        }

        // 3) Как в старом проекте: отправляем initData ЗАГОЛОВКАМИ (без body)
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
          return;
        }

        setTgUser((j as MeOk).user);
        setIsAdmin((j as MeOk).isAdmin);
        setWarn('');
      } catch (e) {
        console.error(e);
        setWarn('Ошибка запроса /api/me');
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
    <main className="profile">
      <TopBarBack />

      <h1 className="profile-title">Мой профиль</h1>

      <p className="profile-hello">
        Здравствуйте <span className="profile-name">{loading ? '...' : displayName}</span>
      </p>

      {warn && <p className="warn">{warn}</p>}

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
