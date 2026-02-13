/* path: app/vopros/[id]/edit/page.tsx */
'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopBarBack from '../../../../components/TopBarBack';
import { VRACHI_LIST } from '../../../lib/vrachi';

type TgWebApp = {
  ready?: () => void;
  expand?: () => void;
  initData?: string;
  HapticFeedback?: { impactOccurred?: (type: 'light' | 'medium') => void };
  showAlert?: (msg: string) => void;
};

const MAX_TITLE_LEN = 30;

function tg(): TgWebApp | null {
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

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit & { timeoutMs?: number } = {}) {
  const timeoutMs = init.timeoutMs ?? 25000;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal, cache: 'no-store' });
    return res;
  } finally {
    clearTimeout(t);
  }
}

function getTelegramInitDataSmart(): string {
  const wa = tg();
  const fromWa = (wa?.initData || '').trim();
  if (fromWa) return fromWa;

  try {
    const sp = new URLSearchParams(window.location.search);
    const q = (sp.get('tgWebAppData') || '').trim();
    if (q) return q;
  } catch {}

  try {
    const hash = (window.location.hash || '').replace(/^#/, '');
    const sp2 = new URLSearchParams(hash);
    const h = (sp2.get('tgWebAppData') || '').trim();
    if (h) return h;
  } catch {}

  return '';
}

export default function VoprosEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params?.id || '').trim();

  const formRef = useRef<HTMLFormElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  const [speciality, setSpeciality] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimerRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    try {
      tg()?.showAlert?.(msg);
    } catch {}
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    try {
      tg()?.ready?.();
      tg()?.expand?.();
    } catch {}

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!id) return;
      setLoading(true);

      try {
        const res = await fetchWithTimeout(`/api/question/edit-info?id=${encodeURIComponent(id)}`, {
          method: 'GET',
          timeoutMs: 25000,
        });

        const j = await res.json().catch(() => ({} as any));
        if (!alive) return;

        if (!res.ok || !j?.ok) {
          showToast(String(j?.error || 'Не удалось загрузить данные.'));
          setCanEdit(false);
          setLoading(false);
          return;
        }

        setSpeciality(String(j.speciality || ''));
        setTitle(String(j.title || ''));
        setBody(String(j.body || ''));
        setCanEdit(!!j.canEdit);
        setLoading(false);

        if (!j.canEdit) {
          showToast(j.editUsed ? 'Редактирование уже использовано.' : 'Редактирование недоступно.');
        }
      } catch (e: any) {
        console.error(e);
        if (!alive) return;
        showToast(e?.name === 'AbortError' ? 'Таймаут загрузки.' : 'Сеть/сервер недоступны.');
        setCanEdit(false);
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const validate = () => {
    if (!speciality) return 'Выберите раздел медицины.';
    if (title.trim().length < 6) return 'Заголовок слишком короткий (минимум 6 символов).';
    if (title.trim().length > MAX_TITLE_LEN) return `Заголовок слишком длинный (максимум ${MAX_TITLE_LEN} символов).`;
    if (body.trim().length < 50) return 'Опишите вопрос подробнее (минимум 50 символов).';
    return '';
  };

  const onSave = async () => {
    if (saving) return;

    const err = validate();
    if (err) {
      haptic('light');
      showToast(err);
      return;
    }

    haptic('medium');
    setSaving(true);

    try {
      const initData = getTelegramInitDataSmart();

      const res = await fetchWithTimeout('/api/question/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeoutMs: 25000,
        body: JSON.stringify({
          initData,
          questionId: id,
          speciality: speciality.trim(),
          title: title.trim(),
          body: body.trim(),
        }),
      });

      const j = await res.json().catch(() => ({} as any));
      if (!res.ok || !j?.ok) {
        haptic('light');
        showToast(String(j?.error || 'Не удалось сохранить.'));
        setSaving(false);
        return;
      }

      showToast('Сохранено ✅ Редактирование использовано.');
      setCanEdit(false);
      router.push(`/vopros/${encodeURIComponent(id)}`);
    } catch (e: any) {
      console.error(e);
      showToast(e?.name === 'AbortError' ? 'Таймаут: сервер отвечает слишком долго.' : 'Сеть/сервер недоступны.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <main className="edit-page">
      <TopBarBack />

      <section className="edit-card" aria-label="Редактирование вопроса">
        <header className="edit-header">
          <h1 className="edit-title">Редактировать вопрос</h1>
          <div className="edit-underline" />
          <p className="edit-note">
            Можно изменить <b>категорию</b>, <b>заголовок</b> и <b>текст</b> — <b>только один раз</b>.
          </p>
        </header>

        {loading ? (
          <div className="loading">Загрузка…</div>
        ) : !canEdit ? (
          <div className="blocked">
            Редактирование недоступно.
            <div className="blockedHint">Причины: уже редактировали или вопрос закрыт.</div>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit}>
            <label className="field">
              <span className="field-label">Раздел медицины</span>
              <div className="select-wrap">
                <select value={speciality} onChange={(e) => setSpeciality(e.target.value)}>
                  <option value="" disabled>
                    Выберите раздел медицины
                  </option>
                  {VRACHI_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="field">
              <span className="field-label">Заголовок</span>
              <input
                type="text"
                className="text-input"
                placeholder="Краткий заголовок вопроса"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={MAX_TITLE_LEN}
              />
              <p className="field-hint">
                Максимум {MAX_TITLE_LEN} символов. Сейчас: {title.trim().length}
              </p>
            </label>

            <label className="field">
              <span className="field-label">Текст вопроса</span>
              <textarea
                className="textarea-input"
                placeholder="Опишите проблему максимально детально"
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={6000}
              />
              <p className={'field-hint ' + (body.trim().length < 50 ? 'field-hint--warning' : '')}>
                Минимум 50 символов. Сейчас: {body.trim().length}
              </p>
            </label>

            <button type="submit" className="save" disabled={saving} onClick={() => haptic('medium')}>
              {saving ? 'Сохраняем…' : 'Сохранить (1 раз)'}
            </button>
          </form>
        )}
      </section>

      {toast ? <div className="toast">{toast}</div> : null}

      <style jsx>{`
        .edit-page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px);
          display: flex;
          flex-direction: column;
          gap: 18px;
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif;
        }

        .edit-card {
          margin-top: 4px;
          padding-bottom: 12px;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        .edit-header {
          text-align: center;
          margin-bottom: 14px;
        }

        .edit-title {
          margin: 0;
          font-size: 20px;
          font-weight: 900;
          color: #0b0c10;
        }

        .edit-underline {
          margin: 6px auto 0;
          width: 140px;
          height: 3px;
          border-radius: 999px;
          background: #2563eb;
        }

        .edit-note {
          margin: 10px 0 0;
          font-size: 12px;
          line-height: 1.35;
          color: rgba(17, 24, 39, 0.7);
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.18);
        }

        .loading {
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.85);
          font-weight: 700;
          color: rgba(15, 23, 42, 0.7);
          text-align: center;
        }

        .blocked {
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(239, 68, 68, 0.18);
          background: rgba(239, 68, 68, 0.06);
          font-weight: 800;
          color: rgba(185, 28, 28, 1);
          text-align: center;
        }

        .blockedHint {
          margin-top: 6px;
          font-weight: 700;
          font-size: 11px;
          color: rgba(185, 28, 28, 0.8);
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 14px;
        }

        .field-label {
          font-size: 13px;
          font-weight: 700;
          color: #111827;
        }

        .select-wrap {
          position: relative;
        }

        .select-wrap select {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          padding: 10px 38px 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(15, 23, 42, 0.18);
          background: #f9fafb;
          font-size: 14px;
          color: #111827;
        }

        .select-wrap::after {
          content: '▾';
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: rgba(15, 23, 42, 0.65);
          pointer-events: none;
        }

        .text-input,
        .textarea-input {
          width: 100%;
          border-radius: 10px;
          border: 1px solid rgba(15, 23, 42, 0.18);
          background: #f9fafb;
          font-size: 14px;
          padding: 10px 12px;
          color: #111827;
        }

        .textarea-input {
          resize: vertical;
          min-height: 150px;
        }

        .field-hint {
          margin: 0;
          font-size: 11px;
          line-height: 1.4;
          color: rgba(75, 85, 99, 0.9);
        }

        .field-hint--warning {
          color: #b45309;
        }

        .save {
          margin-top: 18px;
          width: 100%;
          padding: 13px 16px;
          border-radius: 999px;
          border: none;
          background: #2563eb;
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 12px 26px rgba(37, 99, 235, 0.35);
        }

        .save:disabled {
          opacity: 0.65;
          cursor: default;
        }

        .save:active {
          transform: scale(0.98);
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.4);
        }

        .toast {
          position: fixed;
          left: 12px;
          right: 12px;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
          z-index: 10000;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(17, 24, 39, 0.92);
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </main>
  );
}
