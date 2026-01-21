/* path: app/hamburger/profile/admin/doctor/moderation/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../../../../components/TopBarBack';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

type Item = {
  id: string;
  status: 'PENDING' | 'NEED_FIX' | 'APPROVED' | 'REJECTED';
  updatedAt: string;
  submittedAt: string | null;

  telegramId: string;
  telegramUsername: string | null;
  telegramFirstName: string | null;
  telegramLastName: string | null;

  firstName: string;
  lastName: string;
  city: string | null;
  speciality1: string;
  experienceYears: number;

  // ✅ совместимость
  profilePhotoUrl: string | null;
  diplomaPhotoUrl: string | null;

  // ✅ новый формат
  profilePhotoUrls: string[];
  diplomaPhotoUrls: string[];
};

type ApiOk = { ok: true; items: Item[] };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

function getDisplayName(it: Item) {
  const name = [it.lastName, it.firstName].filter(Boolean).join(' ');
  return name || 'Врач';
}

function tgDisplay(it: Item) {
  const n = [it.telegramFirstName, it.telegramLastName].filter(Boolean).join(' ');
  if (n) return n;
  if (it.telegramUsername) return `@${it.telegramUsername}`;
  return it.telegramId;
}

export default function DoctorModerationPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setWarn('');

        const res = await fetch('/api/admin/doctors/moderation', {
          method: 'GET',
          cache: 'no-store',
          headers: { 'X-Requested-With': 'fetch' },
        });

        const j = (await res.json().catch(() => null)) as ApiResp | null;

        if (!res.ok || !j || (j as any).ok !== true) {
          setWarn((j as any)?.error || 'Не удалось загрузить анкеты');
          setItems([]);
          return;
        }

        setItems((j as ApiOk).items || []);
      } catch (e) {
        console.error(e);
        setWarn('Ошибка сети / сервера');
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const go = (id: string) => {
    haptic('light');
    router.push(`/hamburger/profile/admin/doctor/${encodeURIComponent(id)}`);
  };

  const count = useMemo(() => items.length, [items]);

  return (
    <main className="page">
      <TopBarBack />

      <h1 className="title">Анкеты на модерацию</h1>
      <p className="sub">{loading ? 'Загрузка…' : `Найдено: ${count}`}</p>

      {warn && <p className="warn">{warn}</p>}

      {!loading && !warn && items.length === 0 && <div className="empty">Пока нет анкет на проверку.</div>}

      <section className="list">
        {items.map((it) => (
          <button key={it.id} type="button" className="card" onClick={() => go(it.id)}>
            <div className="row">
              <div className="left">
                <div className="name">{getDisplayName(it)}</div>
                <div className="meta">
                  {it.speciality1} • {it.experienceYears} лет • {it.city || '—'}
                </div>
                <div className="meta2">Telegram: {tgDisplay(it)}</div>
                <div className="badge">{it.status}</div>
              </div>
            </div>

            <div className="photos">
              <div className="ph">
                <div className="phTitle">
                  Профиль {it.profilePhotoUrls?.length ? <span className="cnt">({it.profilePhotoUrls.length})</span> : null}
                </div>

                {it.profilePhotoUrls?.length ? (
                  <div className="grid">
                    {it.profilePhotoUrls.slice(0, 3).map((u) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={u} className="img" src={u} alt="profile" />
                    ))}
                  </div>
                ) : it.profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="imgOne" src={it.profilePhotoUrl} alt="profile" />
                ) : (
                  <div className="phEmpty">нет</div>
                )}
              </div>

              <div className="ph">
                <div className="phTitle">
                  Документы {it.diplomaPhotoUrls?.length ? <span className="cnt">({it.diplomaPhotoUrls.length})</span> : null}
                </div>

                {it.diplomaPhotoUrls?.length ? (
                  <div className="grid">
                    {it.diplomaPhotoUrls.slice(0, 3).map((u) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={u} className="img" src={u} alt="doc" />
                    ))}
                  </div>
                ) : it.diplomaPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="imgOne" src={it.diplomaPhotoUrl} alt="doc" />
                ) : (
                  <div className="phEmpty">нет</div>
                )}
              </div>
            </div>
          </button>
        ))}
      </section>

      <style jsx>{`
        .page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        .title {
          margin: 6px 0 0;
          font-size: 22px;
          font-weight: 900;
          color: #111827;
        }

        .sub {
          margin: 6px 0 12px;
          font-size: 13px;
          color: #6b7280;
        }

        .warn {
          margin: 0 0 12px;
          font-size: 12px;
          color: #ef4444;
        }

        .empty {
          padding: 14px 12px;
          border: 1px dashed rgba(156, 163, 175, 0.8);
          border-radius: 14px;
          color: #6b7280;
          background: #fafafa;
          font-size: 13px;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .card {
          text-align: left;
          width: 100%;
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 18px;
          padding: 12px;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .card:active {
          transform: scale(0.99);
          opacity: 0.95;
        }

        .row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .left {
          flex: 1;
          min-width: 0;
        }

        .name {
          font-weight: 900;
          font-size: 16px;
          color: #111827;
        }

        .meta,
        .meta2 {
          margin-top: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .badge {
          margin-top: 8px;
          display: inline-block;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 800;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.12);
          color: #16a34a;
          border: 1px solid rgba(34, 197, 94, 0.22);
        }

        .photos {
          margin-top: 10px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .phTitle {
          font-size: 12px;
          font-weight: 900;
          color: #111827;
          margin-bottom: 6px;
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .cnt {
          font-size: 11px;
          color: #6b7280;
          font-weight: 800;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }

        .img {
          width: 100%;
          height: 86px;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #f3f4f6;
          display: block;
        }

        .imgOne {
          width: 100%;
          height: 160px;
          object-fit: cover;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #f3f4f6;
          display: block;
        }

        .phEmpty {
          width: 100%;
          height: 160px;
          border-radius: 14px;
          border: 1px dashed rgba(156, 163, 175, 0.8);
          display: grid;
          place-items: center;
          color: #6b7280;
          background: #fafafa;
          font-size: 12px;
        }
      `}</style>
    </main>
  );
}
