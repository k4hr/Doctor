/* path: app/hamburger/profile/doctor/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../components/TopBarBack';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

/* cookie helpers */
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
function getInitDataFromCookie(): string {
  return getCookie('tg_init_data');
}

type DoctorMeOk = {
  ok: true;
  telegramId: string;
  isDoctor: boolean;
  doctor: null | {
    id: string;
    status: string;
    statusRu?: string;
    canAccessDoctorCabinet?: boolean;

    firstName: string | null;
    lastName: string | null;
    middleName: string | null;
    city: string | null;
    speciality1: string | null;
    speciality2: string | null;
    speciality3: string | null;
  };
};

type DoctorMeErr = { ok: false; error: string; hint?: string };
type DoctorMeResponse = DoctorMeOk | DoctorMeErr;

function displayNameFromDoctor(d: DoctorMeOk['doctor']) {
  const first = String(d?.firstName ?? '').trim();
  const last = String(d?.lastName ?? '').trim();
  const full = [last, first].filter(Boolean).join(' ').trim();
  return full || 'врач';
}

export default function DoctorProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');
  const [doctor, setDoctor] = useState<DoctorMeOk['doctor']>(null);

  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try {
      WebApp?.ready?.();
    } catch {}

    const initData = (WebApp?.initData as string) || getInitDataFromCookie();
    if (WebApp?.initData && typeof WebApp.initData === 'string' && WebApp.initData.length > 0) {
      setCookie('tg_init_data', WebApp.initData, 3);
    }

    (async () => {
      try {
        setLoading(true);
        setWarn('');

        if (!initData) {
          setWarn('Нет initData от Telegram. Открой из бота.');
          router.replace('/hamburger/profile');
          return;
        }

        const rDoc = await fetch('/api/doctor/me', {
          method: 'GET',
          headers: {
            'X-Telegram-Init-Data': initData,
            'X-Init-Data': initData,
          },
          cache: 'no-store',
        });

        const jDoc = (await rDoc.json().catch(() => null)) as DoctorMeResponse | null;

        const canStayHere =
          !!jDoc &&
          (jDoc as any).ok === true &&
          (jDoc as DoctorMeOk).isDoctor === true &&
          !!(jDoc as DoctorMeOk).doctor?.canAccessDoctorCabinet;

        if (!canStayHere) {
          router.replace('/hamburger/profile');
          return;
        }

        setDoctor((jDoc as DoctorMeOk).doctor);
      } catch (e) {
        console.error(e);
        setWarn('Ошибка запроса /api/doctor/me');
        router.replace('/hamburger/profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const titleName = useMemo(() => (loading ? '...' : displayNameFromDoctor(doctor)), [doctor, loading]);
  const statusRu = useMemo(() => String((doctor as any)?.statusRu || 'Одобрена'), [doctor]);

  const go = (path: string) => {
    haptic('light');
    router.push(path);
  };

  return (
    <main className="profile">
      <TopBarBack />

      <h1 className="profile-title">Мой профиль врача</h1>

      <p className="profile-hello">
        Здравствуйте <span className="profile-name">{titleName}</span>
      </p>

      <p className="profile-sub">Статус: <b>{statusRu}</b></p>

      {warn && <p className="warn">{warn}</p>}

      <section className="profile-card">
        <button type="button" className="profile-btn" onClick={() => go('/doctor')}>
          <span className="profile-btn-title">Кабинет врача</span>
          <span className="profile-btn-sub">Анкета, ответы, настройки</span>
        </button>

        <button type="button" className="profile-btn" onClick={() => go('/hamburger/questions')}>
          <span className="profile-btn-title">Вопросы</span>
          <span className="profile-btn-sub">Список вопросов</span>
        </button>

        <button type="button" className="profile-btn" onClick={() => go('/hamburger/consultations')}>
          <span className="profile-btn-title">Консультации</span>
          <span className="profile-btn-sub">Ваши консультации</span>
        </button>
      </section>

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
          margin: 6px 0 2px;
          font-size: 14px;
          line-height: 1.45;
          color: #374151;
        }

        .profile-sub {
          margin: 0 0 10px;
          font-size: 12px;
          color: #6b7280;
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
      `}</style>
    </main>
  );
}
