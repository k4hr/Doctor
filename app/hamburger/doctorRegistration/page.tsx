/* path: app/hamburger/doctorRegistration/page.tsx */
'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBarBack from '../../../components/TopBarBack';
import { VRACHI_LIST } from '../../lib/vrachi';

type TgWebApp = {
  MainButton?: {
    show?: () => void;
    hide?: () => void;
    setText?: (t: string) => void;
    enable?: () => void;
    disable?: () => void;
    showProgress?: (leaveActive?: boolean) => void;
    hideProgress?: () => void;
    onClick?: (cb: () => void) => void;
    offClick?: (cb?: () => void) => void;
    setParams?: (p: Record<string, any>) => void;
  };
  HapticFeedback?: { impactOccurred?: (type: 'light' | 'medium') => void };
  showAlert?: (msg: string) => void;
};

function tg(): TgWebApp | null {
  try {
    return (window as any)?.Telegram?.WebApp || null;
  } catch {
    return null;
  }
}

function isTWA(): boolean {
  return !!tg();
}

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    tg()?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

function tgAlert(msg: string) {
  try {
    tg()?.showAlert?.(msg);
  } catch {
    alert(msg);
  }
}

function getTelegramInitData(): string {
  try {
    return (window as any)?.Telegram?.WebApp?.initData || '';
  } catch {
    return '';
  }
}

function niceFieldName(name: string) {
  const map: Record<string, string> = {
    lastName: 'Фамилия',
    firstName: 'Имя',
    gender: 'Пол',
    speciality1: 'Основная специализация',
    education: 'Образование',
    experienceYears: 'Стаж работы',
    email: 'E-mail',
    about: 'О себе',
    specialityDetails: 'Специализация подробно',
    experienceDetails: 'Опыт работы',
  };
  return map[name] || name;
}

function focusFirstInvalid(form: HTMLFormElement) {
  const firstInvalid = form.querySelector(':invalid') as
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | null;

  if (firstInvalid) {
    firstInvalid.focus?.();
    firstInvalid.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    const field = (firstInvalid.getAttribute('name') || '').trim();
    tgAlert(field ? `Проверьте поле: «${niceFieldName(field)}».` : 'Проверьте обязательные поля.');
  } else {
    tgAlert('Проверьте обязательные поля.');
  }
}

const MAX_PROFILE = 3;
const MAX_DOCS = 10;

function clampFiles(files: FileList | null | undefined, max: number): File[] {
  if (!files || files.length === 0) return [];
  return Array.from(files).slice(0, max);
}

function revokeUrls(urls: string[]) {
  try {
    urls.forEach((u) => URL.revokeObjectURL(u));
  } catch {}
}

export default function DoctorRegistrationPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [profilePhotos, setProfilePhotos] = useState<File[]>([]);
  const [docPhotos, setDocPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const inTwa = useMemo(() => (typeof window !== 'undefined' ? isTWA() : false), []);

  const profileUrls = useMemo(() => profilePhotos.map((f) => URL.createObjectURL(f)), [profilePhotos]);
  const docUrls = useMemo(() => docPhotos.map((f) => URL.createObjectURL(f)), [docPhotos]);

  // чистим objectURL
  useEffect(() => {
    return () => {
      revokeUrls(profileUrls);
      revokeUrls(docUrls);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => revokeUrls(profileUrls);
  }, [profileUrls]);

  useEffect(() => {
    return () => revokeUrls(docUrls);
  }, [docUrls]);

  const validateFiles = () => {
    if (profilePhotos.length === 0) {
      tgAlert(`Загрузите фото профиля (1–${MAX_PROFILE}).`);
      return false;
    }
    if (docPhotos.length === 0) {
      tgAlert(`Загрузите документы/диплом (1–${MAX_DOCS}).`);
      return false;
    }
    if (profilePhotos.length > MAX_PROFILE) {
      tgAlert(`Фото профиля: максимум ${MAX_PROFILE}.`);
      return false;
    }
    if (docPhotos.length > MAX_DOCS) {
      tgAlert(`Документы: максимум ${MAX_DOCS}.`);
      return false;
    }
    return true;
  };

  const submitAll = async () => {
    if (submitting) return;

    const form = formRef.current;
    if (!form) return;

    // 1) поля
    const ok = form.reportValidity();
    if (!ok) {
      haptic('light');
      focusFirstInvalid(form);
      return;
    }

    // 2) файлы
    if (!validateFiles()) {
      haptic('light');
      return;
    }

    // 3) initData
    const initData = getTelegramInitData();
    if (!initData) {
      tgAlert('Откройте страницу через Telegram (WebApp).');
      return;
    }

    haptic('medium');

    try {
      setSubmitting(true);

      // A) register
      const data = Object.fromEntries(new FormData(form).entries());

      const resReg = await fetch('/api/doctor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, initData }),
      });

      const jReg = await resReg.json().catch(() => ({}));

      if (!resReg.ok) {
        const msg =
          jReg?.error === 'BAD_HASH'
            ? 'Ошибка проверки Telegram (BAD_HASH). Проверь TELEGRAM_BOT_TOKEN на сервере.'
            : jReg?.error === 'VALIDATION_ERROR'
              ? `Ошибка в поле: ${niceFieldName(jReg?.field || '')}`
              : 'Ошибка сохранения анкеты. Попробуйте ещё раз.';
        tgAlert(msg);
        return;
      }

      // B) upload (мультифайлы)
      const fd = new FormData();
      fd.append('initData', initData);

      // ключи ДОЛЖНЫ совпадать с upload/route.ts
      profilePhotos.forEach((f) => fd.append('profilePhotos', f, f.name));
      docPhotos.forEach((f) => fd.append('docPhotos', f, f.name));

      const resUp = await fetch('/api/doctor/upload', { method: 'POST', body: fd });
      const jUp = await resUp.json().catch(() => ({}));

      if (!resUp.ok) {
        const msg =
          jUp?.error === 'BAD_HASH'
            ? 'Ошибка проверки Telegram (BAD_HASH). Проверь TELEGRAM_BOT_TOKEN на сервере.'
            : 'Ошибка загрузки документов. Попробуйте ещё раз.';
        tgAlert(msg);
        return;
      }

      tgAlert('Анкета и документы отправлены. Профиль ушёл на модерацию.');
      router.push('/hamburger/profile');
    } catch (e) {
      console.error(e);
      tgAlert('Сеть/сервер недоступны. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitAll();
  };

  // Telegram MainButton
  useEffect(() => {
    const wa = tg();
    if (!wa?.MainButton) return;

    const onMain = () => {
      submitAll();
    };

    try {
      wa.MainButton.setText?.(submitting ? 'Отправка…' : 'Отправить на модерацию');
      wa.MainButton.setParams?.({
        is_visible: true,
        color: '#24c768',
        text_color: '#ffffff',
        is_active: !submitting,
      });
      wa.MainButton.show?.();

      if (submitting) {
        wa.MainButton.disable?.();
        wa.MainButton.showProgress?.(true);
      } else {
        wa.MainButton.hideProgress?.();
        wa.MainButton.enable?.();
      }

      wa.MainButton.offClick?.();
      wa.MainButton.onClick?.(onMain);
    } catch {}

    return () => {
      try {
        wa.MainButton?.offClick?.(onMain);
        wa.MainButton?.hideProgress?.();
        wa.MainButton?.hide?.();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting, profilePhotos.length, docPhotos.length]);

  return (
    <main className="docreg">
      <TopBarBack />

      <h1 className="docreg-title">Анкета врача</h1>

      <button
        type="button"
        className="docreg-treb-link"
        onClick={() => router.push('/hamburger/doctorRegistration/treb')}
      >
        Требования по заполнению профиля
      </button>

      <p className="docreg-sub">
        Заполните данные и прикрепите документы. После отправки профиль попадёт на модерацию.
      </p>

      <form ref={formRef} className="docreg-form" onSubmit={handleSubmit}>
        {/* БЛОК 1 — Личные данные */}
        <section className="docreg-card">
          <h2 className="docreg-card-title">Личные данные</h2>

          <label className="docreg-field">
            <span className="docreg-label">
              Фамилия<span className="req">*</span>
            </span>
            <input name="lastName" type="text" required placeholder="Иванов" className="docreg-input" autoComplete="family-name" />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">
              Имя<span className="req">*</span>
            </span>
            <input name="firstName" type="text" required placeholder="Иван" className="docreg-input" autoComplete="given-name" />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Отчество</span>
            <input name="middleName" type="text" placeholder="Отчество (по желанию)" className="docreg-input" />
          </label>

          <div className="docreg-field">
            <span className="docreg-label">
              Пол<span className="req">*</span>
            </span>
            <div className="docreg-radio-row">
              <label className="docreg-radio">
                <input type="radio" name="gender" value="male" required defaultChecked />
                <span>Мужской</span>
              </label>
              <label className="docreg-radio">
                <input type="radio" name="gender" value="female" />
                <span>Женский</span>
              </label>
            </div>
          </div>

          <div className="docreg-field">
            <span className="docreg-label">Дата рождения</span>
            <div className="docreg-dob-row">
              <input name="birthDay" type="number" inputMode="numeric" placeholder="День" className="docreg-input" min={1} max={31} />
              <input name="birthMonth" type="number" inputMode="numeric" placeholder="Месяц" className="docreg-input" min={1} max={12} />
              <input name="birthYear" type="number" inputMode="numeric" placeholder="Год" className="docreg-input" min={1900} max={2100} />
            </div>
          </div>

          <label className="docreg-field">
            <span className="docreg-label">Город</span>
            <input name="city" type="text" placeholder="Город работы/приёма" className="docreg-input" />
          </label>
        </section>

        {/* БЛОК 2 — Профессиональные навыки */}
        <section className="docreg-card">
          <h2 className="docreg-card-title">Профессиональные навыки</h2>

          <div className="docreg-field">
            <span className="docreg-label">
              Специализации<span className="req">*</span>
            </span>

            <select name="speciality1" required className="docreg-input docreg-select" defaultValue="">
              <option value="" disabled>Основная специализация</option>
              {VRACHI_LIST.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>

            <select name="speciality2" className="docreg-input docreg-select docreg-select-second" defaultValue="">
              <option value="" disabled>Дополнительная специализация (по желанию)</option>
              {VRACHI_LIST.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>

            <select name="speciality3" className="docreg-input docreg-select docreg-select-third" defaultValue="">
              <option value="" disabled>Ещё одна специализация (по желанию)</option>
              {VRACHI_LIST.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>

            <span className="docreg-hint">
              Выберите до трёх специальностей, по которым у вас есть профильное образование.
            </span>
          </div>

          <label className="docreg-field">
            <span className="docreg-label">
              Образование<span className="req">*</span>
            </span>
            <textarea name="education" required placeholder="ВУЗ, годы обучения, факультет, квалификация." className="docreg-textarea" rows={3} />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Научная степень</span>
            <select name="degree" className="docreg-input docreg-select" defaultValue="none">
              <option value="none">Нет</option>
              <option value="specialist">Специалист</option>
              <option value="candidate">Кандидат наук</option>
              <option value="doctor">Доктор наук</option>
            </select>
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Место работы</span>
            <input name="workplace" type="text" placeholder="Клиника, медцентр" className="docreg-input" />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Должность</span>
            <input name="position" type="text" placeholder="Должность" className="docreg-input" />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">
              Стаж работы, лет<span className="req">*</span>
            </span>
            <input name="experienceYears" type="number" required min={0} max={70} inputMode="numeric" placeholder="Общий стаж" className="docreg-input" />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Награды</span>
            <textarea name="awards" placeholder="Награды, благодарности" className="docreg-textarea" rows={2} />
          </label>
        </section>

        {/* БЛОК 3 — Контактные данные */}
        <section className="docreg-card">
          <h2 className="docreg-card-title">Контактные данные</h2>

          <label className="docreg-field">
            <span className="docreg-label">
              E-mail<span className="req">*</span>
            </span>
            <input name="email" type="email" required placeholder="doctor@example.com" className="docreg-input" autoComplete="email" />
          </label>
        </section>

        {/* БЛОК 4 — Дополнительно */}
        <section className="docreg-card">
          <h2 className="docreg-card-title">Дополнительно</h2>

          <label className="docreg-field">
            <span className="docreg-label">
              О себе<span className="req">*</span>
            </span>
            <textarea name="about" required placeholder="Коротко о себе и подходе к пациентам" className="docreg-textarea" rows={3} />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">
              Специализация подробно<span className="req">*</span>
            </span>
            <textarea name="specialityDetails" required placeholder="С какими запросами работаете" className="docreg-textarea" rows={3} />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">
              Опыт работы<span className="req">*</span>
            </span>
            <textarea name="experienceDetails" required placeholder="Опишите опыт работы" className="docreg-textarea" rows={3} />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Повышение квалификации</span>
            <textarea name="courses" placeholder="Курсы, стажировки" className="docreg-textarea" rows={2} />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Достижения и награды</span>
            <textarea name="achievements" placeholder="Достижения" className="docreg-textarea" rows={2} />
          </label>

          <label className="docreg-field">
            <span className="docreg-label">Научные труды</span>
            <textarea name="publications" placeholder="Публикации" className="docreg-textarea" rows={2} />
          </label>
        </section>

        {/* БЛОК 5 — Документы */}
        <section className="docreg-card">
          <div className="docs-head">
            <h2 className="docreg-card-title docs-h2">Документы</h2>
            <button
              type="button"
              className="docs-req-link"
              onClick={() => router.push('/hamburger/doctorRegistration/treb')}
            >
              Перед загрузкой документов еще раз ознакомьтесь с требованиями
            </button>
          </div>

          <div className="docs-grid">
            <div className="docs-item">
              <div className="docs-title">
                Фото профиля<span className="req">*</span> <span className="docs-limit">(до {MAX_PROFILE})</span>
              </div>

              {profileUrls.length > 0 ? (
                <div className="thumbs">
                  {profileUrls.map((u, idx) => (
                    <div className="thumb" key={u}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="thumbImg" src={u} alt={`profile-${idx + 1}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="placeholder">Фото не выбрано</div>
              )}

              <input
                className="file"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const next = clampFiles(e.target.files, MAX_PROFILE);
                  if (e.target.files && e.target.files.length > MAX_PROFILE) {
                    tgAlert(`Можно выбрать максимум ${MAX_PROFILE} фото профиля.`);
                  }
                  setProfilePhotos(next);
                  e.currentTarget.value = '';
                }}
              />

              <div className="hint">Портрет, хорошее освещение.</div>

              {profilePhotos.length > 0 && (
                <button type="button" className="miniDanger" onClick={() => setProfilePhotos([])}>
                  Очистить
                </button>
              )}
            </div>

            <div className="docs-item">
              <div className="docs-title">
                Фото диплома/документов<span className="req">*</span> <span className="docs-limit">(до {MAX_DOCS})</span>
              </div>

              {docUrls.length > 0 ? (
                <div className="thumbs">
                  {docUrls.map((u, idx) => (
                    <div className="thumb" key={u}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="thumbImg" src={u} alt={`doc-${idx + 1}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="placeholder">Документы не выбраны</div>
              )}

              <input
                className="file"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const next = clampFiles(e.target.files, MAX_DOCS);
                  if (e.target.files && e.target.files.length > MAX_DOCS) {
                    tgAlert(`Можно выбрать максимум ${MAX_DOCS} фото документов.`);
                  }
                  setDocPhotos(next);
                  e.currentTarget.value = '';
                }}
              />

              <div className="hint">Фото читаемое: ФИО, ВУЗ, дата. Можно несколько страниц.</div>

              {docPhotos.length > 0 && (
                <button type="button" className="miniDanger" onClick={() => setDocPhotos([])}>
                  Очистить
                </button>
              )}
            </div>
          </div>
        </section>

        {!inTwa && (
          <div className="docreg-submit-wrap">
            <button type="submit" className="docreg-submit" disabled={submitting}>
              {submitting ? 'Отправка…' : 'Отправить на модерацию'}
            </button>
            <p className="docreg-footnote">
              Нажимая «Отправить», вы подтверждаете корректность данных и согласны на модерацию.
            </p>
          </div>
        )}
      </form>

      <style jsx global>{`
        html, body { overflow-x: hidden !important; overscroll-behavior-x: none; }
        body::before { pointer-events: none !important; }
      `}</style>

      <style jsx>{`
        .docreg {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          position: relative;
          z-index: 1;
        }

        .docreg-title {
          margin: 4px 0 0;
          font-size: 24px;
          font-weight: 900;
          color: #111827;
        }

        .docreg-treb-link {
          margin: 6px 0 0;
          padding: 0;
          background: transparent;
          border: none;
          display: inline-block;
          font-size: 13px;
          font-weight: 700;
          color: #2563eb;
          text-align: left;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .docreg-sub {
          margin: 6px 0 12px;
          font-size: 13px;
          line-height: 1.5;
          color: #6b7280;
        }

        .docreg-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 4px;
          width: 100%;
          max-width: 100%;
        }

        .docreg-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 16px 14px 14px;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
          border: 1px solid rgba(15, 23, 42, 0.04);
          width: 100%;
          box-sizing: border-box;
        }

        .docreg-card-title {
          margin: 0 0 10px;
          font-size: 17px;
          font-weight: 800;
          color: #111827;
        }

        .docreg-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 10px;
          width: 100%;
        }

        .docreg-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .req { color: #ef4444; margin-left: 2px; }

        .docreg-input, .docreg-textarea, .docreg-select {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(156, 163, 175, 0.7);
          padding: 9px 11px;
          font-size: 14px;
          outline: none;
          background: #ffffff;
          box-sizing: border-box;
          max-width: 100%;
        }

        .docreg-textarea { resize: vertical; min-height: 72px; }
        .docreg-select { padding-right: 28px; }
        .docreg-select-second, .docreg-select-third { margin-top: 6px; }

        .docreg-input:focus, .docreg-textarea:focus, .docreg-select:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.4);
        }

        .docreg-hint { font-size: 11px; color: #9ca3af; }

        .docreg-radio-row { display: flex; gap: 16px; margin-top: 2px; flex-wrap: wrap; }
        .docreg-radio { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #4b5563; }
        .docreg-radio input { accent-color: #22c55e; }

        .docreg-dob-row { display: flex; gap: 8px; width: 100%; }
        .docreg-dob-row .docreg-input { flex: 1; min-width: 0; }

        .docs-head { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
        .docs-h2 { margin-bottom: 0; }

        .docs-req-link {
          padding: 0;
          border: 0;
          background: transparent;
          color: #2563eb;
          font-size: 12px;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .docs-req-link:active { opacity: 0.7; }

        .docs-grid { display: grid; gap: 12px; }
        .docs-item { width: 100%; }

        .docs-title { font-size: 13px; font-weight: 800; color: #111827; margin-bottom: 8px; }
        .docs-limit { font-weight: 700; color: #6b7280; font-size: 12px; margin-left: 6px; }

        .thumbs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 10px;
          width: 100%;
        }

        .thumb {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          overflow: hidden;
          background: #fafafa;
          aspect-ratio: 1 / 1;
          display: block;
        }

        .thumbImg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .placeholder {
          width: 100%;
          height: 180px;
          border-radius: 14px;
          border: 1px dashed rgba(156, 163, 175, 0.8);
          display: grid;
          place-items: center;
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 10px;
          background: #fafafa;
        }

        .file { width: 100%; max-width: 100%; }
        .hint { margin-top: 8px; font-size: 11px; color: #9ca3af; }

        .miniDanger {
          margin-top: 10px;
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
        .miniDanger:active { transform: scale(0.99); }

        .docreg-submit-wrap {
          position: sticky;
          bottom: 0;
          z-index: 10;
          margin: 10px -16px 0;
          padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(15, 23, 42, 0.06);
        }

        .docreg-submit {
          width: 100%;
          padding: 14px 16px;
          border-radius: 999px;
          border: none;
          background: #24c768;
          color: #ffffff;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          box-shadow: 0 10px 22px rgba(36, 199, 104, 0.35);
        }

        .docreg-submit:disabled { opacity: 0.65; cursor: default; }

        .docreg-footnote {
          margin: 8px 4px 0;
          font-size: 11px;
          color: #6b7280;
          text-align: left;
        }
      `}</style>
    </main>
  );
}
