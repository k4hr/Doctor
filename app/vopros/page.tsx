/* path: app/vopros/page.tsx */
'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../components/TopBarBack';
import { VRACHI_LIST } from '../lib/vrachi';
import { feedUpsertTop } from '../lib/questionsStore';

type TgWebApp = {
  ready?: () => void;
  expand?: () => void;
  initData?: string;
  HapticFeedback?: { impactOccurred?: (type: 'light' | 'medium') => void };
  showAlert?: (msg: string) => void;
};

type TgUser = {
  id?: string | number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

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

/**
 * Telegram initData:
 *  - window.Telegram.WebApp.initData
 *  - URL ?tgWebAppData
 *  - URL #tgWebAppData
 */
function getTelegramInitDataSmart(): { initData: string; source: string } {
  const wa = tg();
  const fromWa = (wa?.initData || '').trim();
  if (fromWa) return { initData: fromWa, source: 'Telegram.WebApp.initData' };

  try {
    const sp = new URLSearchParams(window.location.search);
    const q = (sp.get('tgWebAppData') || '').trim();
    if (q) return { initData: q, source: 'URL ?tgWebAppData' };
  } catch {}

  try {
    const hash = (window.location.hash || '').replace(/^#/, '');
    const sp2 = new URLSearchParams(hash);
    const h = (sp2.get('tgWebAppData') || '').trim();
    if (h) return { initData: h, source: 'URL #tgWebAppData' };
  } catch {}

  return { initData: '', source: 'none' };
}

function extractTgUserFromInitData(initData: string): TgUser | null {
  try {
    const params = new URLSearchParams(String(initData || ''));
    const userStr = params.get('user');
    if (!userStr) return null;
    const u = JSON.parse(userStr);
    if (!u || !u.id) return null;
    return {
      id: u.id,
      username: u.username ? String(u.username) : null,
      first_name: u.first_name ? String(u.first_name) : null,
      last_name: u.last_name ? String(u.last_name) : null,
    };
  } catch {
    return null;
  }
}

function buildAuthorLabel(authorIsAnonymous: boolean, user: TgUser | null): string {
  if (authorIsAnonymous) return 'Вопрос от Анонимно';

  const uname = (user?.username || '').trim();
  if (uname) return `Вопрос от @${uname.replace(/^@/, '')}`;

  const fn = (user?.first_name || '').trim();
  const ln = (user?.last_name || '').trim();
  const full = [fn, ln].filter(Boolean).join(' ').trim();
  if (full) return `Вопрос от ${full}`;

  return 'Вопрос от Пользователь';
}

const MAX_PHOTOS = 10;
const MAX_TITLE_LEN = 30;

function clampFiles(files: FileList | null | undefined, max: number): File[] {
  if (!files || files.length === 0) return [];
  return Array.from(files).slice(0, max);
}

function revokeUrls(urls: string[]) {
  try {
    urls.forEach((u) => URL.revokeObjectURL(u));
  } catch {}
}

function parseKeywordsClient(raw: string): string {
  return String(raw || '').trim();
}

export default function VoprosPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [speciality, setSpeciality] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [keywords, setKeywords] = useState('');

  // ✅ выбор: платный/бесплатный
  const [isPaid, setIsPaid] = useState(false);

  // ✅ выбор: анонимно / показать имя
  const [authorIsAnonymous, setAuthorIsAnonymous] = useState(true);

  // ✅ опционально (скрыто, на будущее)
  const [assignedDoctorId, setAssignedDoctorId] = useState('');

  const [photos, setPhotos] = useState<File[]>([]);
  const [photosInputKey, setPhotosInputKey] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState('');
  const [toast, setToast] = useState('');
  const toastTimerRef = useRef<any>(null);

  const photoUrls = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);

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

  useEffect(() => () => revokeUrls(photoUrls), [photoUrls]);

  const validate = () => {
    if (!speciality) return 'Выберите раздел медицины.';
    if (title.trim().length < 6) return 'Заголовок слишком короткий (минимум 6 символов).';
    if (title.trim().length > MAX_TITLE_LEN) return `Заголовок слишком длинный (максимум ${MAX_TITLE_LEN} символов).`;
    if (body.trim().length < 50) return 'Опишите вопрос подробнее (минимум 50 символов).';
    if (photos.length > MAX_PHOTOS) return `Можно загрузить максимум ${MAX_PHOTOS} фото.`;
    return '';
  };

  const submitAll = async () => {
    if (submitting) return;

    const err = validate();
    if (err) {
      haptic('light');
      showToast(err);
      return;
    }

    const waExists = !!tg();
    const { initData, source } = getTelegramInitDataSmart();

    if (!waExists || !initData) {
      const host = typeof window !== 'undefined' ? window.location.host : '';
      showToast(
        `Нет initData (${source}). Telegram.WebApp=${waExists ? 'есть' : 'нет'}. Домен=${host}. ` +
          `Проверь: @BotFather /setdomain и открывать как WebApp (web_app кнопка / menu button).`
      );
      return;
    }

    haptic('medium');

    try {
      setSubmitting(true);

      setStage('Отправляем вопрос…');

      // ✅ Для платного вопроса: isFree=false, priceRub=600 (минимум по твоим правилам)
      const isFree = !isPaid;
      const priceRub = isPaid ? 600 : 0;

      const resCreate = await fetchWithTimeout('/api/question/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeoutMs: 25000,
        body: JSON.stringify({
          initData,
          speciality: speciality.trim(),
          title: title.trim(),
          body: body.trim(),
          keywords: parseKeywordsClient(keywords),
          assignedDoctorId: assignedDoctorId.trim() || undefined,
          authorIsAnonymous,
          isFree,
          priceRub,
        }),
      });

      const jCreate = await resCreate.json().catch(() => ({} as any));
      if (!resCreate.ok || !jCreate?.ok || !jCreate?.id) {
        const msg =
          jCreate?.field
            ? `Проверь поле: ${String(jCreate.field)}`
            : jCreate?.error
              ? `Ошибка: ${String(jCreate.error)}`
              : `Ошибка отправки (${resCreate.status})`;
        haptic('light');
        showToast(msg);
        setStage('');
        return;
      }

      const questionId = String(jCreate.id);
      const createdAtIso =
        typeof jCreate?.createdAt === 'string' && jCreate.createdAt ? String(jCreate.createdAt) : new Date().toISOString();

      const tgUser = extractTgUserFromInitData(initData);
      const optimisticAuthorLabel = buildAuthorLabel(authorIsAnonymous, tgUser);

      feedUpsertTop({
        id: questionId,
        title: title.trim(),
        bodySnippet: body.trim(),
        createdAt: createdAtIso,
        doctorLabel: speciality.trim() || '—',
        authorLabel: optimisticAuthorLabel,
        status: 'WAITING',
        priceBadge: isPaid ? 'PAID' : 'FREE',
        priceText: isPaid ? '600 ₽' : undefined,
        optimistic: true,
      });

      if (photos.length > 0) {
        setStage('Загружаем фото…');

        const fd = new FormData();
        fd.append('initData', initData);
        fd.append('questionId', questionId);
        photos.forEach((f) => fd.append('photos', f, f.name));

        const resUp = await fetchWithTimeout('/api/question/upload', {
          method: 'POST',
          body: fd,
          timeoutMs: 45000,
        });

        const jUp = await resUp.json().catch(() => ({} as any));
        if (!resUp.ok || !jUp?.ok) {
          const msg = jUp?.error ? `Upload error: ${String(jUp.error)}` : `Ошибка загрузки фото (${resUp.status})`;
          haptic('light');
          showToast(msg);
          setStage('');
          return;
        }
      }

      setStage('Готово ✅');
      showToast('Вопрос отправлен.');

      setSpeciality('');
      setTitle('');
      setBody('');
      setKeywords('');
      setAssignedDoctorId('');
      setPhotos([]);
      setPhotosInputKey((x) => x + 1);
      setAuthorIsAnonymous(true);
      setIsPaid(false);

      router.push('/');
    } catch (e: any) {
      console.error(e);
      if (e?.name === 'AbortError') showToast('Таймаут: сервер отвечает слишком долго. Попробуйте ещё раз.');
      else showToast('Сеть/сервер недоступны. Попробуйте позже.');
    } finally {
      setSubmitting(false);
      setTimeout(() => setStage(''), 1200);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitAll();
  };

  return (
    <main className="ask-page">
      <TopBarBack />

      <section className="ask-card" aria-label="Форма вопроса врачу">
        <header className="ask-header">
          <h1 className="ask-title">Задать вопрос врачу</h1>
          <div className="ask-underline" />
        </header>

        <form ref={formRef} onSubmit={handleSubmit}>
          {/* ✅ 1) В САМОМ ВЕРХУ — платный/бесплатный */}
          <section className="field" aria-label="Тип вопроса">
            <span className="field-label">Тип вопроса</span>

            <div className="payRow" role="group" aria-label="Платный или бесплатный">
              <button
                type="button"
                className={'payBtn ' + (!isPaid ? 'payBtn--active' : '')}
                onClick={() => {
                  haptic('light');
                  setIsPaid(false);
                }}
              >
                Бесплатный вопрос
              </button>

              <button
                type="button"
                className={'payBtn ' + (isPaid ? 'payBtn--active' : '')}
                onClick={() => {
                  haptic('light');
                  setIsPaid(true);
                }}
              >
                Платный вопрос
              </button>
            </div>

            {isPaid ? <p className="field-hint">Минимальная стоимость платного вопроса — <b>600 ₽</b>.</p> : null}
          </section>

          {/* ✅ 2) СРАЗУ ПОД ЭТИМ — показывать автора */}
          <section className="field" aria-label="Приватность автора">
            <span className="field-label">Показывать автора</span>

            <div className="anonRow" role="group" aria-label="Настройка автора">
              <button
                type="button"
                className={'anonBtn ' + (authorIsAnonymous ? 'anonBtn--active' : '')}
                onClick={() => {
                  haptic('light');
                  setAuthorIsAnonymous(true);
                }}
              >
                Анонимно
              </button>

              <button
                type="button"
                className={'anonBtn ' + (!authorIsAnonymous ? 'anonBtn--active' : '')}
                onClick={() => {
                  haptic('light');
                  setAuthorIsAnonymous(false);
                }}
              >
                Моё имя в Telegram
              </button>
            </div>

            <p className="field-hint">
              На карточке будет: <b>{authorIsAnonymous ? 'Вопрос от Анонимно' : 'Вопрос от @username/Имя'}</b>
            </p>
          </section>

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

            <p className="field-hint">
              Если сомневаетесь — выберите{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  haptic('light');
                  setSpeciality('Терапевт');
                }}
              >
                терапевт
              </button>
              .
            </p>
          </label>

          <label className="field">
            <span className="field-label">Заголовок вопроса</span>
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
            <span className="field-label">Ваш вопрос врачу</span>
            <textarea
              className="textarea-input"
              placeholder="Постарайтесь описать проблему максимально детально"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={6000}
            />
            <p className={'field-hint ' + (body.trim().length < 50 ? 'field-hint--warning' : '')}>
              Минимум 50 символов. Сейчас: {body.trim().length}
            </p>
          </label>

          <label className="field">
            <span className="field-label">Ключевые слова</span>
            <input
              type="text"
              className="text-input"
              placeholder="Например: температура, ребёнок, нурофен (через запятую)"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              maxLength={220}
            />
            <p className="field-hint">Это поможет людям находить похожие вопросы в общем поиске.</p>
          </label>

          <section className="field">
            <div className="photos-head">
              <span className="field-label">Фотографии (необязательно)</span>
              <span className="photos-limit">до {MAX_PHOTOS}</span>
            </div>

            {photoUrls.length ? (
              <div className="thumbs">
                {photoUrls.map((u, idx) => (
                  <div className="thumb" key={u}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="thumbImg" src={u} alt={`photo-${idx + 1}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="placeholder">Фото не выбраны</div>
            )}

            <input
              key={photosInputKey}
              className="file"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const next = clampFiles(e.target.files, MAX_PHOTOS);
                if (e.target.files && e.target.files.length > MAX_PHOTOS) {
                  showToast(`Можно выбрать максимум ${MAX_PHOTOS} фото.`);
                }
                setPhotos(next);
                setPhotosInputKey((x) => x + 1);
              }}
            />

            <div className="hint">Загружайте только то, что относится к вопросу (анализы/кожа/снимки и т.п.).</div>

            {photos.length > 0 && (
              <button
                type="button"
                className="miniDanger"
                onClick={() => {
                  haptic('light');
                  setPhotos([]);
                  setPhotosInputKey((x) => x + 1);
                }}
              >
                Очистить фото
              </button>
            )}
          </section>

          <input type="hidden" value={assignedDoctorId} onChange={(e) => setAssignedDoctorId(e.target.value)} />

          <button type="submit" className="ask-submit" disabled={submitting} onClick={() => haptic('medium')}>
            {submitting ? 'Отправка…' : 'Отправить вопрос'}
          </button>

          {stage ? <div className="stage">{stage}</div> : null}
        </form>
      </section>

      {toast ? <div className="toast">{toast}</div> : null}

      <style jsx>{`
        .ask-page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px);
          display: flex;
          flex-direction: column;
          gap: 18px;
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif;
        }

        .ask-card {
          margin-top: 4px;
          padding-bottom: 12px;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        .ask-header {
          text-align: center;
          margin-bottom: 16px;
        }

        .ask-title {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #0b0c10;
        }

        .ask-underline {
          margin: 6px auto 0;
          width: 88px;
          height: 3px;
          border-radius: 999px;
          background: #24c768;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 14px;
        }

        .field-label {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        .payRow {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .payBtn {
          width: 100%;
          border-radius: 12px;
          padding: 10px 12px;
          border: 1px solid rgba(15, 23, 42, 0.14);
          background: rgba(249, 250, 251, 1);
          color: rgba(17, 24, 39, 0.82);
          font-weight: 900;
          font-size: 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .payBtn--active {
          border-color: rgba(36, 199, 104, 0.42);
          background: rgba(36, 199, 104, 0.1);
          color: #166534;
          box-shadow: 0 10px 22px rgba(36, 199, 104, 0.14);
        }

        .payBtn:active {
          transform: scale(0.99);
        }

        .anonRow {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .anonBtn {
          width: 100%;
          border-radius: 12px;
          padding: 10px 12px;
          border: 1px solid rgba(15, 23, 42, 0.14);
          background: rgba(249, 250, 251, 1);
          color: rgba(17, 24, 39, 0.82);
          font-weight: 800;
          font-size: 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .anonBtn--active {
          border-color: rgba(36, 199, 104, 0.42);
          background: rgba(36, 199, 104, 0.1);
          color: #166534;
          box-shadow: 0 10px 22px rgba(36, 199, 104, 0.14);
        }

        .anonBtn:active {
          transform: scale(0.99);
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
          min-height: 110px;
        }

        .text-input::placeholder,
        .textarea-input::placeholder {
          color: rgba(107, 114, 128, 0.85);
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

        .link-btn {
          border: none;
          padding: 0;
          background: none;
          color: #2563eb;
          font-size: 11px;
          font-weight: 600;
          text-decoration: underline;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .photos-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
        }

        .photos-limit {
          font-size: 11px;
          font-weight: 800;
          color: rgba(75, 85, 99, 0.8);
        }

        .thumbs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 6px;
        }

        .thumb {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          overflow: hidden;
          background: #fafafa;
          aspect-ratio: 1 / 1;
        }

        .thumbImg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .placeholder {
          width: 100%;
          height: 160px;
          border-radius: 14px;
          border: 1px dashed rgba(156, 163, 175, 0.8);
          display: grid;
          place-items: center;
          color: #6b7280;
          font-size: 13px;
          background: #fafafa;
        }

        .file {
          width: 100%;
          max-width: 100%;
        }

        .hint {
          margin-top: 4px;
          font-size: 11px;
          color: #9ca3af;
        }

        .miniDanger {
          margin-top: 8px;
          border: 1px solid rgba(239, 68, 68, 0.35);
          background: rgba(239, 68, 68, 0.06);
          color: #b91c1c;
          font-weight: 800;
          border-radius: 12px;
          padding: 10px 12px;
          width: 100%;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .miniDanger:active {
          transform: scale(0.99);
        }

        .ask-submit {
          margin-top: 18px;
          width: 100%;
          padding: 13px 16px;
          border-radius: 999px;
          border: none;
          background: #24c768;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          text-align: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 12px 26px rgba(36, 199, 104, 0.4);
        }

        .ask-submit:disabled {
          opacity: 0.65;
          cursor: default;
        }

        .ask-submit:active {
          transform: scale(0.98);
          box-shadow: 0 8px 18px rgba(36, 199, 104, 0.45);
        }

        .stage {
          margin-top: 8px;
          font-size: 12px;
          font-weight: 700;
          color: #374151;
          text-align: center;
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
          font-weight: 700;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </main>
  );
}
