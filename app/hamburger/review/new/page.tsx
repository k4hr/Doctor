/* path: app/hamburger/review/new/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function tgAlert(msg: string) {
  try {
    (window as any)?.Telegram?.WebApp?.showAlert?.(msg);
    return;
  } catch {}
  alert(msg);
}

type PublicDoctorDto = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  speciality1: string | null;
  speciality2: string | null;
  speciality3: string | null;
  avatarUrl: string | null;
};

type PublicDoctorOk = { ok: true; doctor: PublicDoctorDto };
type PublicDoctorErr = { ok: false; error: string; hint?: string };
type PublicDoctorResp = PublicDoctorOk | PublicDoctorErr;

function fullName(d: PublicDoctorDto | null) {
  const a = String(d?.lastName ?? '').trim();
  const b = String(d?.firstName ?? '').trim();
  const c = String(d?.middleName ?? '').trim();
  return [a, b, c].filter(Boolean).join(' ').trim() || 'Врач';
}

function specsLine(d: PublicDoctorDto | null) {
  const parts = [d?.speciality1, d?.speciality2, d?.speciality3].filter(Boolean).map((x) => String(x).trim());
  return parts.length ? parts.join(', ') : '';
}

function StarsPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const v = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;

  return (
    <div className="starsWrap" aria-label="Оценка звёздами">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= v;
        return (
          <button
            key={n}
            type="button"
            className={on ? 'star starOn' : 'star'}
            onClick={() => {
              haptic('light');
              onChange(n);
            }}
            aria-label={`Поставить ${n}`}
          >
            ★
          </button>
        );
      })}

      <style jsx>{`
        .starsWrap {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 10px;
        }
        .star {
          border: 0;
          background: transparent;
          font-size: 30px;
          line-height: 1;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          color: rgba(17, 24, 39, 0.18);
          font-weight: 900;
          padding: 2px;
        }
        .starOn {
          color: #f59e0b;
        }
        .star:active {
          transform: scale(0.98);
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}

export default function NewReviewPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const doctorId = useMemo(() => String(sp?.get('doctorId') || '').trim(), [sp]);
  const questionId = useMemo(() => String(sp?.get('questionId') || '').trim(), [sp]);

  const [initData, setInitData] = useState('');
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');

  const [doctor, setDoctor] = useState<PublicDoctorDto | null>(null);

  const [isAnonymous, setIsAnonymous] = useState(true);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try {
      WebApp?.ready?.();
    } catch {}

    const idata = (WebApp?.initData as string) || getInitDataFromCookie();
    if (WebApp?.initData && typeof WebApp.initData === 'string' && WebApp.initData.length > 0) {
      setCookie('tg_init_data', WebApp.initData, 3);
    }
    setInitData(idata || '');
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setWarn('');

        if (!doctorId || !questionId) {
          setWarn('Не хватает doctorId/questionId');
          setDoctor(null);
          return;
        }

        const r = await fetch(`/api/doctor/public?doctorId=${encodeURIComponent(doctorId)}`, {
          method: 'GET',
          cache: 'no-store',
        });

        const j = (await r.json().catch(() => null)) as PublicDoctorResp | null;

        if (!r.ok || !j || (j as any).ok !== true) {
          setWarn((j as any)?.hint || (j as any)?.error || 'Не удалось загрузить врача');
          setDoctor(null);
          return;
        }

        setDoctor((j as PublicDoctorOk).doctor);
      } catch (e) {
        console.error(e);
        setWarn('Ошибка сети/сервера');
        setDoctor(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [doctorId, questionId]);

  const title = useMemo(() => fullName(doctor), [doctor]);
  const specs = useMemo(() => specsLine(doctor), [doctor]);

  const submit = async () => {
    if (saving) return;

    if (!doctorId || !questionId) {
      tgAlert('Не хватает doctorId/questionId');
      return;
    }

    const r = Math.max(1, Math.min(5, Number(rating) || 0));
    if (r < 1 || r > 5) {
      tgAlert('Оценка должна быть от 1 до 5');
      return;
    }

    try {
      setSaving(true);
      setWarn('');
      haptic('medium');

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (initData) {
        headers['X-Telegram-Init-Data'] = initData;
        headers['X-Init-Data'] = initData;
      }

      const res = await fetch('/api/doctor/reviews', {
        method: 'POST',
        headers,
        cache: 'no-store',
        body: JSON.stringify({
          doctorId,
          questionId,
          rating: r,
          text: String(text || '').trim() || null,
          isAnonymous: !!isAnonymous,
        }),
      });

      const j = await res.json().catch(() => null);

      if (!res.ok || !j || j.ok !== true) {
        tgAlert(j?.hint || j?.error || `Ошибка (${res.status})`);
        haptic('light');
        return;
      }

      try {
        (window as any)?.Telegram?.WebApp?.showAlert?.('Отзыв отправлен ✅');
      } catch {}
      haptic('light');

      router.back();
    } catch (e) {
      console.error(e);
      tgAlert('Ошибка сети/сервера');
      haptic('light');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      <TopBarBack />

      <div className="card">
        <div className="cardTitle">Оставить отзыв</div>

        {loading ? <div className="muted">Загрузка…</div> : null}
        {warn ? <div className="warn">{warn}</div> : null}

        {!loading && doctor ? (
          <div className="doc">
            <div className="avatar">
              {doctor.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={doctor.avatarUrl} alt="" />
              ) : (
                <div className="ph">D</div>
              )}
            </div>
            <div className="docText">
              <div className="docName">{title}</div>
              {specs ? <div className="docSpecs">{specs}</div> : null}
            </div>
          </div>
        ) : null}

        <div className="row">
          <div className="rowLabel">Анонимный отзыв</div>
          <button
            type="button"
            className={isAnonymous ? 'toggle toggleOn' : 'toggle'}
            onClick={() => {
              haptic('light');
              setIsAnonymous((v) => !v);
            }}
            aria-label="Анонимность"
          >
            <span className="toggleKnob" />
          </button>
        </div>
        <div className="hint">{isAnonymous ? 'Отзыв будет анонимным' : 'Отзыв будет не анонимным'}</div>

        <div className="sep" />

        <div className="centerTitle">Оценка</div>
        <StarsPicker value={rating} onChange={setRating} />
        <div className="hintCenter">Выбрано: {Math.max(1, Math.min(5, Number(rating) || 5))} / 5</div>

        <div className="sep" />

        <div className="centerTitle">Текст отзыва</div>
        <textarea
          className="ta"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Напиши пару слов (по желанию)…"
        />

        <button type="button" className="btn" onClick={submit} disabled={saving || loading || !!warn}>
          {saving ? 'Отправляем…' : 'Отправить отзыв'}
        </button>
      </div>

      <style jsx>{`
        .page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          background: #f6f7fb;
        }

        .card {
          background: #fff;
          border-radius: 18px;
          padding: 14px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
          margin-top: 10px;
        }

        .cardTitle {
          font-size: 16px;
          font-weight: 950;
          color: #111827;
        }

        .muted {
          margin-top: 10px;
          font-size: 13px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.55);
        }

        .warn {
          margin-top: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          background: rgba(254, 226, 226, 0.55);
          color: #991b1b;
          font-size: 13px;
          font-weight: 850;
        }

        .doc {
          margin-top: 12px;
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 10px;
          border-radius: 14px;
          background: rgba(249, 250, 251, 0.9);
          border: 1px solid rgba(15, 23, 42, 0.08);
        }

        .avatar {
          width: 46px;
          height: 46px;
          border-radius: 999px;
          overflow: hidden;
          background: #f3f4f6;
          border: 1px solid rgba(15, 23, 42, 0.08);
          flex: 0 0 auto;
        }
        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ph {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          font-weight: 950;
          color: #111827;
        }

        .docText {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .docName {
          font-size: 13px;
          font-weight: 950;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .docSpecs {
          font-size: 12px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.6);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .row {
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .rowLabel {
          font-size: 13px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.8);
        }

        .toggle {
          width: 54px;
          height: 32px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(17, 24, 39, 0.06);
          position: relative;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .toggleOn {
          background: rgba(36, 199, 104, 0.18);
          border-color: rgba(36, 199, 104, 0.35);
        }
        .toggleKnob {
          position: absolute;
          top: 50%;
          left: 4px;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 10px 20px rgba(18, 28, 45, 0.12);
          transition: 160ms ease;
        }
        .toggleOn .toggleKnob {
          left: 26px;
        }

        .hint {
          margin-top: 6px;
          font-size: 12px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.55);
        }

        .sep {
          margin: 14px 0;
          height: 1px;
          background: rgba(17, 24, 39, 0.08);
        }

        .centerTitle {
          text-align: center;
          font-size: 13px;
          font-weight: 950;
          color: #111827;
        }
        .hintCenter {
          margin-top: 6px;
          text-align: center;
          font-size: 12px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.55);
        }

        .ta {
          width: 100%;
          margin-top: 10px;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.10);
          background: rgba(249, 250, 251, 0.9);
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.85);
          outline: none;
          resize: vertical;
        }

        .btn {
          margin-top: 12px;
          width: 100%;
          border: none;
          border-radius: 14px;
          padding: 12px 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          background: #24c768;
          color: #fff;
          font-size: 14px;
          font-weight: 950;
          box-shadow: 0 10px 20px rgba(36, 199, 104, 0.22);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .btn:active:not(:disabled) {
          transform: scale(0.99);
          opacity: 0.95;
        }
      `}</style>
    </main>
  );
}
