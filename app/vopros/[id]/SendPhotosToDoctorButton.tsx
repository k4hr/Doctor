/* path: app/vopros/[id]/SendPhotosToDoctorButton.tsx */
'use client';

import { useState } from 'react';

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
  return String(getCookie('tg_init_data') || '').trim();
}

type RespOk = { ok: true; sent: number };
type RespErr = { ok: false; error: string; hint?: string; index?: number };
type Resp = RespOk | RespErr;

export default function SendPhotosToDoctorButton({ questionId }: { questionId: string }) {
  const [loading, setLoading] = useState(false);

  async function onSend() {
    if (loading) return;
    haptic('medium');

    const initData = getInitDataNow();
    if (!initData) {
      tgAlert('Нет initData. Открой мини-приложение через Telegram.');
      return;
    }

    setLoading(true);
    try {
      const r = await fetch('/api/question/send-photos-to-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ initData, questionId }),
      });

      const j = (await r.json().catch(() => null)) as Resp | null;

      if (!r.ok || !j || (j as any).ok !== true) {
        const msg = (j as any)?.hint || (j as any)?.error || `Ошибка (${r.status})`;
        tgAlert(String(msg));
        return;
      }

      tgAlert(`Фото отправлены в чат (${(j as RespOk).sent} шт.)`);
    } catch (e: any) {
      tgAlert(String(e?.message || 'Сеть/сервер недоступны'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className="btn" onClick={onSend} disabled={loading}>
        {loading ? 'Отправляем…' : 'Загрузить фото'}
      </button>

      <style jsx>{`
        .btn {
          margin-top: 12px;
          width: 100%;
          max-width: 320px;
          align-self: center;
          display: inline-flex;
          justify-content: center;
          align-items: center;

          border: none;
          border-radius: 999px;
          padding: 12px 14px;

          background: #24c768;
          color: #fff;
          font-size: 14px;
          font-weight: 950;

          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 10px 20px rgba(36, 199, 104, 0.28);
        }

        .btn:active {
          transform: scale(0.98);
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }
      `}</style>
    </>
  );
}
