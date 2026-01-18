/* path: app/hamburger/profile/admin/doctor/page.tsx */
'use client';

import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../../components/TopBarBack';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

export default function AdminDoctorPage() {
  const router = useRouter();

  const go = (path: string) => {
    haptic('light');
    router.push(path);
  };

  return (
    <main className="wrap">
      <TopBarBack />
      <h1 className="title">Врачи</h1>
      <p className="sub">Максимальный контроль над анкетами и доступом</p>

      <section className="card">
        <button type="button" className="item" onClick={() => go('/hamburger/profile/admin/doctor/moderation')}>
          <span className="item-title">Анкеты на модерацию</span>
          <span className="item-sub">Ожидают проверки / правок</span>
        </button>

        <button type="button" className="item" onClick={() => go('/hamburger/profile/admin/doctor/all')}>
          <span className="item-title">Все врачи</span>
          <span className="item-sub">Поиск, фильтры, статусы</span>
        </button>
      </section>

      <section className="ideas">
        <h2 className="ideasTitle">Что ещё добавить для “максимального контроля”</h2>
        <ul className="ideasList">
          <li>Логи модерации (кто/когда/что поменял)</li>
          <li>Статусы: APPROVED / REJECTED / NEED_FIX / SUSPENDED</li>
          <li>Блокировка врача и скрытие из выдачи</li>
          <li>Жалобы на врача и счётчик репортов</li>
          <li>Флаг “подозрительный” и ручной приоритет проверки</li>
        </ul>
      </section>

      <style jsx>{`
        .wrap {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }
        .title {
          margin: 6px 0 0;
          font-size: 24px;
          font-weight: 900;
          color: #111827;
        }
        .sub {
          margin: 6px 0 12px;
          font-size: 13px;
          color: #374151;
        }
        .card {
          background: #fff;
          border-radius: 18px;
          padding: 12px;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
          border: 1px solid rgba(15, 23, 42, 0.04);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .item {
          width: 100%;
          border: 1px solid rgba(156, 163, 175, 0.45);
          background: #fff;
          border-radius: 14px;
          padding: 14px 14px;
          text-align: left;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
        .item:active {
          transform: scale(0.99);
          opacity: 0.95;
        }
        .item-title {
          font-size: 16px;
          font-weight: 900;
          color: #111827;
          line-height: 1.15;
        }
        .item-sub {
          display: block;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.25;
        }
        .ideas {
          margin-top: 14px;
          background: #fff;
          border-radius: 18px;
          padding: 12px;
          border: 1px solid rgba(15, 23, 42, 0.04);
        }
        .ideasTitle {
          margin: 0 0 8px;
          font-size: 14px;
          font-weight: 900;
          color: #111827;
        }
        .ideasList {
          margin: 0;
          padding-left: 18px;
          color: #374151;
          font-size: 12px;
          line-height: 1.4;
        }
      `}</style>
    </main>
  );
}
