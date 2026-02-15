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
      middleName: true,
      city: true,
      speciality1: true,
      speciality2: true,
      speciality3: true,
      experienceYears: true,
      submittedAt: true,
      updatedAt: true,

      ratingSum: true,
      ratingCount: true,

      // ⚠️ если у тебя в Prisma этих полей нет — сборка упадёт.
      // Тогда скажи как они реально называются (или уберём).
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
            const pro = isDoctorPro(d as any);
            const ratingText = calcAvgRating((d as any).ratingSum, (d as any).ratingCount);

            const exp =
              typeof d.experienceYears === 'number' && Number.isFinite(d.experienceYears) ? d.experienceYears : null;
            const expLabel = exp !== null ? `Стаж: ${exp} лет` : 'Стаж: —';

            const specParts = [d.speciality1, d.speciality2, d.speciality3]
              .filter(Boolean)
              .map((x) => String(x).trim());
            const spec = specParts.length ? specParts.join(', ') : '—';

            const cardStyle: React.CSSProperties = pro
              ? {
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: 16,
                  border: '1px solid rgba(180, 83, 9, 0.28)',
                  background:
                    'linear-gradient(135deg, rgba(254, 243, 199, 0.92), rgba(255, 255, 255, 0.88))',
                  boxShadow: '0 8px 20px rgba(245, 158, 11, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  textAlign: 'left',
                  transition: 'transform 120ms ease, box-shadow 120ms ease, filter 120ms ease',
                }
              : {
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: 16,
                  border: '1px solid rgba(34, 197, 94, 0.22)',
                  background: 'rgba(220, 252, 231, 0.75)',
                  boxShadow: '0 8px 20px rgba(22, 163, 74, 0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  textAlign: 'left',
                  transition: 'transform 120ms ease, box-shadow 120ms ease, filter 120ms ease',
                };

            const avatarStyle: React.CSSProperties = {
              width: 44,
              height: 44,
              borderRadius: 999,
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
              color: pro ? '#92400e' : '#16a34a',
              boxShadow: pro ? '0 4px 10px rgba(245, 158, 11, 0.28)' : '0 4px 10px rgba(22, 163, 74, 0.3)',
              flexShrink: 0,
              overflow: 'hidden',
            };

            const nameStyle: React.CSSProperties = {
              fontSize: 14,
              fontWeight: 700,
              color: pro ? 'rgba(124, 45, 18, 0.95)' : '#022c22',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            };

            const specStyle: React.CSSProperties = {
              fontSize: 12,
              color: pro ? 'rgba(124, 45, 18, 0.72)' : 'rgba(15, 23, 42, 0.8)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            };

            const expStyle: React.CSSProperties = pro
              ? {
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(255, 255, 255, 0.92)',
                  border: '1px solid rgba(180, 83, 9, 0.14)',
                  color: 'rgba(124, 45, 18, 0.9)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }
              : {
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#15803d',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                };

            const ratingStyle: React.CSSProperties = {
              color: pro ? 'rgba(124, 45, 18, 0.92)' : '#166534',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            };

            const metaStyle: React.CSSProperties = {
              marginTop: 6,
              fontSize: 11,
              color: 'rgba(15, 23, 42, 0.55)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            };

            return (
              <Link
                key={d.id}
                href={`/hamburger/profile/admin/doctor/${encodeURIComponent(d.id)}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={cardStyle}>
                  <div style={avatarStyle} aria-label="Фото врача">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <span>{doctorAvatarLetter(d)}</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
                      <span style={nameStyle}>{name}</span>
                    </div>

                    <span style={specStyle}>{spec}</span>

                    <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, gap: 10 }}>
                      <span style={expStyle}>{expLabel}</span>
                      {ratingText ? <span style={ratingStyle}>⭐ {ratingText}</span> : null}
                    </div>

                    <div style={metaStyle}>
                      Одобрено: {fmtDate(d.submittedAt)} • Обновлено: {fmtDate(d.updatedAt)}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
