/* path: app/vopros/[id]/close/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TopBarBack from '../../../../components/TopBarBack';
import DoctorCard, { type DoctorCardItem } from '../../../../components/DoctorCard/DoctorCard';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

function tgAlert(msg: string) {
  try {
    (window as any)?.Telegram?.WebApp?.showAlert?.(msg);
    return;
  } catch {}
  alert(msg);
}

function tgConfirm(msg: string, cb: (ok: boolean) => void) {
  try {
    (window as any)?.Telegram?.WebApp?.showConfirm?.(msg, (ok: boolean) => cb(!!ok));
    return;
  } catch {}
  cb(window.confirm(msg));
}

type DoctorPick = DoctorCardItem & {
  doctorId: string;
  answerId: string;
};

type CloseInfoOk = {
  ok: true;
  questionId: string;
  isAuthor: boolean;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  isFree: boolean;
  priceRub: number;
  doctors: DoctorPick[];
  closed: null | {
    selectedDoctorIds: string[];
    totalRub: number;
    perDoctorRub: number;
    status: 'CREATED' | 'PAID';
    createdAt: string;
  };
};

type CloseInfoErr = { ok: false; error: string; hint?: string };
type CloseInfoResp = CloseInfoOk | CloseInfoErr;

type CloseDoOk = {
  ok: true;
  questionId: string;
  selectedDoctorIds: string[];
  totalRub: number;
  perDoctorRub: number;
  status: 'CREATED' | 'PAID';
};
type CloseDoErr = { ok: false; error: string; hint?: string };
type CloseDoResp = CloseDoOk | CloseDoErr;

function fmtRub(n: any) {
  const x = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(x) || x <= 0) return '0 ₽';
  return `${Math.trunc(x)} ₽`;
}

function uniqByDoctor(items: DoctorPick[]) {
  const m = new Map<string, DoctorPick>();
  for (const it of items || []) {
    const k = String(it.doctorId || '').trim();
    if (!k) continue;
    if (!m.has(k)) m.set(k, it);
  }
  return Array.from(m.values());
}

export default function CloseQuestionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params?.id || '');

  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');

  const [info, setInfo] = useState<CloseInfoOk | null>(null);

  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      (window as any)?.Telegram?.WebApp?.ready?.();
      (window as any)?.Telegram?.WebApp?.expand?.();
    } catch {}

    (async () => {
      try {
        setLoading(true);
        setWarn('');

        const r = await fetch(`/api/question/close-info?id=${encodeURIComponent(id)}`, {
          method: 'GET',
          cache: 'no-store',
        });

        const j = (await r.json().catch(() => null)) as CloseInfoResp | null;

        if (!r.ok || !j || (j as any).ok !== true) {
          setWarn((j as any)?.hint || (j as any)?.error || `Ошибка (${r.status})`);
          setInfo(null);
          return;
        }

        const ok = j as CloseInfoOk;
        setInfo(ok);

        if (ok.closed?.selectedDoctorIds?.length) {
          setSelected(ok.closed.selectedDoctorIds.slice(0, 3));
        } else {
          setSelected([]);
        }

        if (!ok.isAuthor) setWarn('Закрыть вопрос может только автор.');
      } catch (e) {
        console.error(e);
        setWarn('Сеть/сервер недоступны.');
        setInfo(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const doctors = useMemo(() => {
    const items = info?.doctors || [];
    return uniqByDoctor(items);
  }, [info?.doctors]);

  const canInteract = !!info && info.isAuthor && !saving;

  const isFree = !!info?.isFree;
  const totalRub = Math.max(0, Number(info?.priceRub || 0));
  const chosenCount = selected.length;

  const perDoctor = useMemo(() => {
    if (!info) return 0;
    if (isFree) return 0;
    if (chosenCount <= 0) return 0;
    return Math.floor(totalRub / chosenCount);
  }, [info, isFree, totalRub, chosenCount]);

  const remainder = useMemo(() => {
    if (!info) return 0;
    if (isFree) return 0;
    if (chosenCount <= 0) return 0;
    return totalRub - perDoctor * chosenCount;
  }, [info, isFree, totalRub, perDoctor, chosenCount]);

  const toggleDoctor = (doctorId: string) => {
    if (!canInteract) return;
    haptic('light');

    setSelected((prev) => {
      const has = prev.includes(doctorId);
      if (has) return prev.filter((x) => x !== doctorId);

      if (prev.length >= 3) {
        tgAlert('Можно выбрать максимум 3 врачей.');
        return prev;
      }
      return [...prev, doctorId];
    });
  };

  const goLeaveReview = (doctorId: string) => {
    haptic('light');
    router.push(`/hamburger/doctor/${encodeURIComponent(doctorId)}?questionId=${encodeURIComponent(id)}`);
  };

  const onClose = () => {
    if (!info || !info.isAuthor) return;

    if (doctors.length === 0) {
      tgAlert('Нельзя закрыть вопрос: пока нет ответов врачей.');
      return;
    }

    if (selected.length === 0) {
      tgAlert('Выбери минимум одного врача (до 3).');
      return;
    }

    const msg = isFree
      ? `Закрыть вопрос и выбрать ${selected.length} врач(а/ей) для отзывов?`
      : `Закрыть вопрос и распределить ${fmtRub(totalRub)} между ${selected.length} врач(а/ей)?\nНа каждого: ${fmtRub(perDoctor)}${
          remainder ? `\nОстаток ${fmtRub(remainder)} уйдёт первому выбранному.` : ''
        }`;

    tgConfirm(msg, async (ok) => {
      if (!ok) return;

      try {
        setSaving(true);
        setWarn('');

        const r = await fetch('/api/question/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            questionId: id,
            selectedDoctorIds: selected,
          }),
        });

        const j = (await r.json().catch(() => null)) as CloseDoResp | null;

        if (!r.ok || !j || (j as any).ok !== true) {
          tgAlert((j as any)?.hint || (j as any)?.error || `Ошибка (${r.status})`);
          return;
        }

        const rr = await fetch(`/api/question/close-info?id=${encodeURIComponent(id)}`, {
          method: 'GET',
          cache: 'no-store',
        });
        const jj = (await rr.json().catch(() => null)) as CloseInfoResp | null;
        if (rr.ok && jj && (jj as any).ok === true) setInfo(jj as CloseInfoOk);

        haptic('medium');
      } catch (e) {
        console.error(e);
        tgAlert('Ошибка сети/сервера.');
      } finally {
        setSaving(false);
      }
    });
  };

  const closedSelected = info?.closed?.selectedDoctorIds || [];
  const closedCards = useMemo(() => {
    const set = new Set(closedSelected);
    return doctors.filter((d) => set.has(d.doctorId));
  }, [doctors, closedSelected]);

  return (
    <main className="page">
      <TopBarBack />

      <div className="head">
        <div className="title">Закрыть вопрос</div>
        <div className="sub">
          {loading ? 'Загрузка…' : info ? (info.isFree ? 'Вопрос бесплатный' : `Вопрос платный: ${fmtRub(totalRub)}`) : '—'}
        </div>
      </div>

      {warn ? <div className="warn">{warn}</div> : null}

      <div className="card">
        <div className="cardTitle">Выбери врачей, которым засчитать ответ</div>
        <div className="cardHint">Можно выбрать максимум 3. После закрытия ты сможешь оставить им отзывы.</div>

        {loading ? <div className="muted">Загрузка списка врачей…</div> : null}
        {!loading && info && doctors.length === 0 ? <div className="muted">Пока никто не ответил.</div> : null}

        <div className="list">
          {doctors.map((doc) => {
            const active = selected.includes(doc.doctorId);

            return (
              <div key={doc.doctorId} className={active ? 'pickWrap pickWrapActive' : 'pickWrap'}>
                <DoctorCard doctor={doc} ratingLabel="5.0" onClick={() => toggleDoctor(doc.doctorId)} />
                <div className={active ? 'check checkOn' : 'check'} aria-hidden="true">
                  ✓
                </div>
              </div>
            );
          })}
        </div>

        {info && !isFree && selected.length ? (
          <div className="sum">
            <div>
              Сумма: <b>{fmtRub(totalRub)}</b>
            </div>
            <div>
              Выбрано: <b>{selected.length}</b> · На каждого: <b>{fmtRub(perDoctor)}</b>
            </div>
            {remainder ? <div className="sumNote">Остаток {fmtRub(remainder)} уйдёт первому выбранному.</div> : null}
          </div>
        ) : null}

        <button type="button" className="closeBtn" onClick={onClose} disabled={!canInteract || !info || saving}>
          {saving ? 'Закрываем…' : 'Закрыть вопрос'}
        </button>
      </div>

      {info?.closed ? (
        <div className="card">
          <div className="cardTitle">Вопрос закрыт</div>
          <div className="cardHint">
            {info.isFree
              ? 'Теперь можно оставить отзывы выбранным врачам.'
              : `Распределено: ${fmtRub(info.closed.totalRub)} · На каждого: ${fmtRub(info.closed.perDoctorRub)}`}
          </div>

          <div className="closedList">
            {closedCards.map((doc) => (
              <div key={doc.doctorId} className="closedRow">
                <DoctorCard doctor={doc} ratingLabel="5.0" onClick={() => goLeaveReview(doc.doctorId)} />
                <button type="button" className="reviewBtn" onClick={() => goLeaveReview(doc.doctorId)}>
                  Оставить отзыв
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .page {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
          background: #f6f7fb;
        }

        .head {
          margin-top: 6px;
          margin-bottom: 10px;
        }

        .title {
          font-size: 18px;
          font-weight: 950;
          color: #111827;
        }

        .sub {
          margin-top: 4px;
          font-size: 12px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.55);
        }

        .warn {
          margin: 10px 0;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          background: rgba(254, 226, 226, 0.55);
          color: #991b1b;
          font-size: 13px;
          font-weight: 850;
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
          font-size: 14px;
          font-weight: 950;
          color: #111827;
        }

        .cardHint {
          margin-top: 4px;
          font-size: 12px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.55);
        }

        .muted {
          margin-top: 10px;
          font-size: 13px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.55);
        }

        .list {
          margin-top: 12px;
          display: grid;
          gap: 10px;
        }

        .pickWrap {
          position: relative;
          border-radius: 18px;
          overflow: visible;
        }

        .pickWrapActive {
          outline: 2px solid rgba(34, 197, 94, 0.35);
          border-radius: 18px;
        }

        .check {
          position: absolute;
          right: 10px;
          top: 10px;
          width: 26px;
          height: 26px;
          border-radius: 10px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(255, 255, 255, 0.9);
          display: grid;
          place-items: center;
          font-weight: 950;
          color: #16a34a;
          opacity: 0;
          transform: scale(0.92);
          transition: 120ms ease;
          pointer-events: none;
        }

        .checkOn {
          opacity: 1;
          transform: scale(1);
        }

        .sum {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(34, 197, 94, 0.22);
          background: rgba(220, 252, 231, 0.45);
          color: rgba(17, 24, 39, 0.78);
          font-size: 13px;
          font-weight: 850;
          display: grid;
          gap: 4px;
        }

        .sumNote {
          font-size: 12px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.55);
        }

        .closeBtn {
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

        .closeBtn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .closeBtn:active:not(:disabled) {
          transform: scale(0.99);
          opacity: 0.95;
        }

        .closedList {
          margin-top: 12px;
          display: grid;
          gap: 10px;
        }

        .closedRow {
          display: grid;
          gap: 8px;
        }

        .reviewBtn {
          width: 100%;
          border: none;
          border-radius: 12px;
          padding: 12px 10px;
          background: rgba(109, 40, 217, 0.12);
          color: #6d28d9;
          font-weight: 950;
          font-size: 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
        }

        .reviewBtn:active {
          transform: scale(0.99);
          opacity: 0.92;
        }
      `}</style>
    </main>
  );
}
