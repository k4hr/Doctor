/* path: app/consultations/ConsultationsClient.tsx */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopBarBack from '../../components/TopBarBack';

function tg(): any | null {
  try {
    return (window as any)?.Telegram?.WebApp || null;
  } catch {
    return null;
  }
}

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    tg()?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

function tgAlert(msg: string) {
  try {
    tg()?.showAlert?.(msg);
    return;
  } catch {}
  alert(msg);
}

/* cookie helpers */
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

function getInitDataNow(): string {
  try {
    const fromTg = String(tg()?.initData || '').trim();
    if (fromTg) return fromTg;
  } catch {}

  const fromCookie = String(getCookie('tg_init_data') || '').trim();
  return fromCookie;
}

type CreateOk = { ok: true; consultationId: string; priceRub: number };
type CreateErr = { ok: false; error: string; hint?: string };
type CreateResp = CreateOk | CreateErr;

type UploadOk = { ok: true; consultationId: string; photos: string[] };
type UploadErr = { ok: false; error: string; hint?: string };
type UploadResp = UploadOk | UploadErr;

type SubmitOk = { ok: true };
type SubmitErr = { ok: false; error: string; hint?: string };
type SubmitResp = SubmitOk | SubmitErr;

export default function ConsultationsStartPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const doctorId = useMemo(() => String(sp.get('doctorId') || '').trim(), [sp]);

  const [problemText, setProblemText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [warn, setWarn] = useState('');
  const [priceRub, setPriceRub] = useState<number>(1000);

  useEffect(() => {
    try {
      tg()?.ready?.();
      tg()?.expand?.();
    } catch {}
  }, []);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
    };
  }, [files]);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;

    const imgs = list.filter((f) => String(f.type || '').startsWith('image/'));
    const merged = [...files, ...imgs].slice(0, 10);

    if ([...files, ...imgs].length > 10) tgAlert('Можно максимум 10 фото.');
    setFiles(merged);

    e.target.value = '';
  }

  function removeFile(i: number) {
    haptic('light');
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSend() {
    haptic('medium');
    setWarn('');

    if (!doctorId) {
      tgAlert('Нет doctorId. Открой консультацию из профиля врача.');
      return;
    }

    const txt = problemText.trim();
    if (txt.length < 10) {
      tgAlert('Опиши проблему чуть подробнее (минимум 10 символов).');
      return;
    }

    if (files.length > 10) {
      tgAlert('Можно максимум 10 фото.');
      return;
    }

    const initData = getInitDataNow();
    if (!initData) {
      setWarn('NO_INIT_DATA');
      tgAlert('Нет initData из Telegram. Открой мини-приложение через Telegram.');
      return;
    }

    setLoading(true);
    try {
      // 1) create draft (ВАЖНО: initData в body)
      const r1 = await fetch('/api/consultation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, doctorId, problemText: txt }),
      });

      const j1 = (await r1.json().catch(() => null)) as CreateResp | null;
      if (!r1.ok || !j1 || (j1 as any).ok !== true) {
        const msg = (j1 as any)?.hint || (j1 as any)?.error || 'Не удалось создать консультацию';
        setWarn(String(msg));
        return;
      }

      const cid = (j1 as CreateOk).consultationId;
      setPriceRub((j1 as CreateOk).priceRub || 1000);

      // 2) upload photos (optional) — здесь initData тоже обязателен
      if (files.length) {
        const fd = new FormData();
        fd.set('initData', initData);
        fd.set('consultationId', cid);
        files.forEach((f) => fd.append('photos', f));

        const r2 = await fetch('/api/consultation/upload', { method: 'POST', body: fd });
        const j2 = (await r2.json().catch(() => null)) as UploadResp | null;
        if (!r2.ok || !j2 || (j2 as any).ok !== true) {
          const msg = (j2 as any)?.hint || (j2 as any)?.error || 'Не удалось загрузить фото';
          setWarn(String(msg));
          return;
        }
      }

      // 3) submit
      const r3 = await fetch('/api/consultation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultationId: cid, initData }),
      });

      const j3 = (await r3.json().catch(() => null)) as SubmitResp | null;
      if (!r3.ok || !j3 || (j3 as any).ok !== true) {
        const msg = (j3 as any)?.hint || (j3 as any)?.error || 'Не удалось отправить заявку';
        setWarn(String(msg));
        return;
      }

      tgAlert('Заявка отправлена врачу.');
      router.replace('/hamburger/profile');
    } catch (e: any) {
      setWarn(String(e?.message || 'Сеть/сервер недоступны'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p">
      <TopBarBack />

      <h1 className="t">Консультация</h1>
      <p className="s">Опиши проблему и прикрепи фото (до 10). Врач решит — принять или отказать.</p>

      <section className="card">
        <div className="label">Описание проблемы</div>
        <textarea
          className="ta"
          value={problemText}
          onChange={(e) => setProblemText(e.target.value)}
          placeholder="Например: неделю держится температура, сыпь, анализы… что беспокоит, как давно, что пробовал/а."
          maxLength={4000}
        />

        <div className="row">
          <div className="hint">{problemText.trim().length}/4000</div>
          <div className="hint">
            Цена: <b>{priceRub} ₽</b> (после подтверждения врачом)
          </div>
        </div>

        <div className="photosTop">
          <div className="label">Фото (до 10)</div>
          <label className="pick">
            <input type="file" accept="image/*" multiple onChange={onPickFiles} />
            Добавить фото
          </label>
        </div>

        {previews.length ? (
          <div className="grid" aria-label="Фото">
            {previews.map((src, i) => (
              <div key={src} className="ph">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="img" src={src} alt="" />
                <button type="button" className="rm" onClick={() => removeFile(i)} aria-label="Удалить фото">
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">Фото не добавлены.</div>
        )}

        {warn ? <div className="warn">{warn}</div> : null}

        <button type="button" className="send" onClick={onSend} disabled={loading}>
          {loading ? 'Отправляем…' : 'Отправить заявку врачу'}
        </button>
      </section>

      <style jsx>{`
        .p {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          background: #f6f7fb;
        }

        .t {
          margin: 6px 0 0;
          font-size: 30px;
          font-weight: 950;
          color: #111827;
          letter-spacing: -0.02em;
        }
        .s {
          margin: 8px 0 14px;
          font-size: 14px;
          font-weight: 700;
          color: rgba(17, 24, 39, 0.58);
          line-height: 1.35;
        }

        .card {
          background: #fff;
          border-radius: 18px;
          padding: 14px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .label {
          font-size: 13px;
          font-weight: 950;
          color: #111827;
        }

        .ta {
          width: 100%;
          min-height: 140px;
          resize: none;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(249, 250, 251, 0.9);
          padding: 12px;
          font-size: 14px;
          font-weight: 700;
          color: rgba(17, 24, 39, 0.82);
          outline: none;
        }

        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .hint {
          font-size: 12px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.55);
        }

        .photosTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .pick {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(255, 255, 255, 0.92);
          font-size: 13px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.78);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
        }

        .pick input {
          display: none;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .ph {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(249, 250, 251, 1);
          aspect-ratio: 1 / 1;
        }

        .img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .rm {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 30px;
          height: 30px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(255, 255, 255, 0.92);
          font-weight: 900;
          cursor: pointer;
        }

        .empty {
          font-size: 13px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.55);
          padding: 6px 0;
        }

        .warn {
          font-size: 12px;
          font-weight: 800;
          color: #ef4444;
          overflow-wrap: anywhere;
        }

        .send {
          margin-top: 2px;
          border: none;
          border-radius: 16px;
          padding: 14px 14px;
          font-size: 15px;
          font-weight: 950;
          color: #ffffff;
          cursor: pointer;
          background: #24c768;
          box-shadow: 0 10px 20px rgba(36, 199, 104, 0.35);
          -webkit-tap-highlight-color: transparent;
        }

        .send:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }
      `}</style>
    </main>
  );
}
