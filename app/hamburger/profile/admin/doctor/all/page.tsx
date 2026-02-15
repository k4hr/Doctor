/* path: app/hamburger/profile/admin/doctor/all/page.tsx */
import crypto from 'crypto';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import TopBarBack from '../../../../../../components/TopBarBack';
import { DoctorFileKind, DoctorStatus } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function timingSafeEqualHex(a: string, b: string) {
  try {
    const ab = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

function verifyAndExtractTelegramId(initData: string, botToken: string): string | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');

    const dcs = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dcs).digest('hex');

    if (!timingSafeEqualHex(computedHash, hash)) return null;

    const userStr = params.get('user');
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    if (!user?.id) return null;

    return String(user.id);
  } catch {
    return null;
  }
}

function isAdmin(telegramId: string) {
  const raw = (process.env.ADMIN_TG_IDS || '').trim();
  if (!raw) return false;
  const set = new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  return set.has(String(telegramId));
}

function envClean(name: string) {
  return String(process.env[name] ?? '').replace(/[\r\n]/g, '').trim();
}

function toPublicUrlMaybe(value: string | null) {
  if (!value) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;

  const base = envClean('R2_PUBLIC_BASE_URL');
  if (!base) return v;
  return `${base.replace(/\/$/, '')}/${v}`;
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

function doctorNameLastFirst(d: { lastName: any; firstName: any }) {
  const ln = String(d?.lastName ?? '').trim();
  const fn = String(d?.firstName ?? '').trim();
  const base = [ln, fn].filter(Boolean).join(' ').trim();
  return base || '—';
}

function doctorAvatarLetter(d: { lastName: any; firstName: any }) {
  const n = String(d?.lastName || d?.firstName || 'D').trim();
  return (n[0] || 'D').toUpperCase();
}

function isDoctorPro(d: { proActive?: any; proUntil?: any }): boolean {
  if (d?.proActive === true) return true;

  const iso = String(d?.proUntil || '').trim();
  if (!iso) return false;

  try {
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return false;
    return t > Date.now();
  } catch {
    return false;
  }
}

function round1(x: number) {
  return Math.round(x * 10) / 10;
}

function calcAvgRating(sum: any, cnt: any): string {
  const s = typeof sum === 'number' ? sum : Number(sum);
  const c = typeof cnt === 'number' ? cnt : Number(cnt);
  if (!Number.isFinite(s) || !Number.isFinite(c) || c <= 0) return '';
  const avg = Math.max(0, Math.min(5, s / c));
  return round1(avg).toFixed(1);
}

export default async function DoctorAllPage() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  const initData = cookies().get('tg_init_data')?.value || '';

  const tgId = botToken && initData ? verifyAndExtractTelegramId(initData, botToken) : null;
  const okAdmin = tgId ? isAdmin(tgId) : false;

  if (!tgId || !okAdmin) {
    return (
      <main style={{ padding: 16 }}>
        <TopBarBack />
        <h1 style={{ marginTop: 8 }}>Доступ запрещён</h1>
        <p style={{ opacity: 0.7 }}>Нужно открыть из Telegram и иметь права администратора.</p>
      </main>
    );
  }

  const doctors = await prisma.doctor.findMany({
    where: { status: DoctorStatus.APPROVED },
    orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }],
    take: 500,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      middleName: true, // оставляем в выборке, но не показываем
      city: true,
      speciality1: true,
      speciality2: true,
      speciality3: true,
      experienceYears: true,
      submittedAt: true,
      updatedAt: true,

      // ✅ рейтинг
      ratingSum: true,
      ratingCount: true,

      // ✅ PRO (чтобы золото работало)
      proActive: true,
      proUntil: true,

      files: {
        where: { kind: DoctorFileKind.PROFILE_PHOTO },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        take: 1,
        select: { url: true },
      },
    },
  });

  return (
    <main style={{ padding: 16 }}>
      <TopBarBack />
      <h1 style={{ marginTop: 8 }}>Одобренные врачи</h1>

      <p style={{ opacity: 0.7, marginTop: 6 }}>
        Нажми на врача — откроется карточка /admin/doctor/[id]. Позже сюда добавим рейтинг, баланс, ответы, онлайн.
      </p>

      <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
        {doctors.length === 0 ? (
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              border: '1px solid #e5e7eb',
              background: '#fff',
              opacity: 0.8,
            }}
          >
            Пока нет одобренных анкет.
          </div>
        ) : (
          doctors.map((d) => {
            const name = doctorNameLastFirst(d);
            const avatar = toPublicUrlMaybe(d.files?.[0]?.url || null);
            const pro = isDoctorPro(d);
            const ratingText = calcAvgRating(d.ratingSum, d.ratingCount);
            const exp =
              typeof d.experienceYears === 'number' && Number.isFinite(d.experienceYears) ? d.experienceYears : null;
            const expLabel = exp !== null ? `Стаж: ${exp} лет` : 'Стаж: —';

            const specParts = [d.speciality1, d.speciality2, d.speciality3].filter(Boolean).map((x) => String(x).trim());
            const spec = specParts.length ? specParts.join(', ') : '—';

            return (
              <Link
                key={d.id}
                href={`/hamburger/profile/admin/doctor/${encodeURIComponent(d.id)}`}
                className={'doconline-card' + (pro ? ' isPro' : '')}
                style={{ textDecoration: 'none' }}
              >
                <div className="doconline-avatar" aria-label="Фото врача">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="" />
                  ) : (
                    <span>{doctorAvatarLetter(d)}</span>
                  )}
                </div>

                <div className="doconline-main">
                  <div className="doconline-name-row">
                    <span className="doconline-name">{name}</span>
                  </div>

                  <span className="doconline-spec">{spec}</span>

                  <div className="doconline-bottom">
                    <span className="doconline-exp">{expLabel}</span>
                    {ratingText ? <span className="doconline-rating">⭐ {ratingText}</span> : null}
                  </div>

                  <div className="admin-meta">
                    Одобрено: {fmtDate(d.submittedAt)} • Обновлено: {fmtDate(d.updatedAt)}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <style jsx>{`
        .doconline-card {
          width: 100%;
          box-sizing: border-box;

          padding: 10px 12px;
          border-radius: 16px;

          border: 1px solid rgba(34, 197, 94, 0.22);
          background: rgba(220, 252, 231, 0.75);
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.16);

          display: flex;
          align-items: center;
          gap: 10px;

          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          text-align: left;

          transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;
        }

        .doconline-card:active {
          transform: translateY(1px);
          box-shadow: 0 6px 16px rgba(22, 163, 74, 0.24);
        }

        /* ✅ PRO = золото */
        .doconline-card.isPro {
          border: 1px solid rgba(180, 83, 9, 0.28);
          background: linear-gradient(135deg, rgba(254, 243, 199, 0.92), rgba(255, 255, 255, 0.88));
          box-shadow: 0 8px 20px rgba(245, 158, 11, 0.18);
        }

        .doconline-card.isPro:active {
          box-shadow: 0 6px 16px rgba(245, 158, 11, 0.26);
        }

        .doconline-avatar {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: #ffffff;

          display: flex;
          align-items: center;
          justify-content: center;

          font-weight: 700;
          font-size: 18px;
          color: #16a34a;

          box-shadow: 0 4px 10px rgba(22, 163, 74, 0.3);
          flex-shrink: 0;
          overflow: hidden;
        }

        .doconline-card.isPro .doconline-avatar {
          color: #92400e;
          box-shadow: 0 4px 10px rgba(245, 158, 11, 0.28);
        }

        .doconline-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .doconline-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .doconline-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-width: 0;
        }

        .doconline-name {
          font-size: 14px;
          font-weight: 700;
          color: #022c22;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .doconline-card.isPro .doconline-name {
          color: rgba(124, 45, 18, 0.95);
        }

        .doconline-spec {
          font-size: 12px;
          color: rgba(15, 23, 42, 0.8);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .doconline-card.isPro .doconline-spec {
          color: rgba(124, 45, 18, 0.72);
        }

        .doconline-bottom {
          margin-top: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          gap: 10px;
        }

        .doconline-exp {
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.9);
          color: #15803d;
          font-weight: 500;
          white-space: nowrap;
        }

        .doconline-card.isPro .doconline-exp {
          color: rgba(124, 45, 18, 0.9);
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(180, 83, 9, 0.14);
        }

        .doconline-rating {
          color: #166534;
          font-weight: 600;
          white-space: nowrap;
        }

        .doconline-card.isPro .doconline-rating {
          color: rgba(124, 45, 18, 0.92);
        }

        .admin-meta {
          margin-top: 6px;
          font-size: 11px;
          color: rgba(15, 23, 42, 0.55);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </main>
  );
}
