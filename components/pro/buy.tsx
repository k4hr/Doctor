/* path: components/pro/buy.tsx */
'use client';

import { useMemo, useState } from 'react';

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

type Plan = 'M1' | 'M3' | 'M6' | 'Y1';

const PLANS: { id: Plan; label: string; months: number; priceRub: number }[] = [
  { id: 'M1', label: '1 месяц', months: 1, priceRub: 199 },
  { id: 'M3', label: '3 месяца', months: 3, priceRub: 499 },
  { id: 'M6', label: '6 месяцев', months: 6, priceRub: 899 },
  { id: 'Y1', label: '12 месяцев', months: 12, priceRub: 1499 },
];

const FEATURES: { good?: boolean; text: string }[] = [
  { good: true, text: 'Появление консультаций' },
  { good: true, text: 'Возможность получать благодарность от клиентов' },
  { good: true, text: 'Уведомления по новым вопросам по вашей специальности (бот в Telegram)' },
  { good: true, text: 'Золотая карточка врача и золотая плашка в профиле' },
];

function monthWordUpper(n: number) {
  const m = Math.abs(Math.trunc(n));
  const mod10 = m % 10;
  const mod100 = m % 100;

  // 11-14 -> МЕСЯЦЕВ
  if (mod100 >= 11 && mod100 <= 14) return 'МЕСЯЦЕВ';
  if (mod10 === 1) return 'МЕСЯЦ';
  if (mod10 >= 2 && mod10 <= 4) return 'МЕСЯЦА';
  return 'МЕСЯЦЕВ';
}

function termUpper(months: number) {
  return `${months} ${monthWordUpper(months)}`;
}

function formatRub(n: number) {
  const x = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  return `${x} ₽`;
}

export default function ProBuyCard() {
  const [plan, setPlan] = useState<Plan>('M1');
  const [loading, setLoading] = useState(false);

  const current = useMemo(() => PLANS.find((p) => p.id === plan)!, [plan]);

  async function onBuy() {
    haptic('medium');
    setLoading(true);
    try {
      const res = await fetch('/api/pro/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.ok) {
        tgAlert(data?.error || 'Не удалось создать оплату. Попробуйте ещё раз.');
        return;
      }

      const url = data?.payUrl || data?.invoiceUrl;
      if (!url) {
        tgAlert('Оплата создана, но ссылка не пришла. Обновите страницу.');
        return;
      }

      try {
        (window as any)?.Telegram?.WebApp?.openLink?.(url);
      } catch {
        window.location.href = url;
      }
    } catch (e: any) {
      tgAlert(e?.message || 'Ошибка сети. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="pro">
        <h2 className="pro-title">ВРАЧ.PRO</h2>

        <div className="pro-card" onClick={() => haptic('light')}>
          <div className="pro-badge">ЗОЛОТОЙ ДОСТУП</div>

          <div className="pro-subtitle">Прокачай профиль врача и получай больше возможностей</div>

          <ul className="pro-features">
            {FEATURES.map((f, i) => (
              <li key={i} className="pro-feature">
                {f.good ? <span className="feat-icon yes">✔</span> : <span className="feat-icon no">✖</span>}
                <span className="feat-text">{f.text}</span>
              </li>
            ))}
          </ul>

          <div className="pro-plans" role="list" aria-label="Тарифы PRO">
            {PLANS.map((p) => {
              const active = p.id === plan;

              const tag =
                p.id === 'M1' ? (
                  <span className="tag tagPopular">популярно</span>
                ) : p.id === 'Y1' ? (
                  <span className="tag tagProfit">выгодно</span>
                ) : null;

              const perMonth = p.months > 1 ? Math.round(p.priceRub / p.months) : null;

              return (
                <button
                  key={p.id}
                  type="button"
                  className={`plan ${active ? 'is-active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    haptic('light');
                    setPlan(p.id);
                  }}
                  aria-pressed={active}
                >
                  {tag ? <div className="tagRow">{tag}</div> : <div className="tagRow" />}

                  <div className="planTerm">{termUpper(p.months)}</div>
                  <div className="planPrice">{formatRub(p.priceRub)}</div>

                  {perMonth !== null ? <div className="planPer">{formatRub(perMonth)} / 1 МЕСЯЦ</div> : <div className="planPer is-empty" />}
                </button>
              );
            })}
          </div>

          <button type="button" className="pro-buy" onClick={onBuy} disabled={loading}>
            {loading ? 'Создаём…' : 'Купить PRO'}
          </button>

          <div className="pro-footnote">
            Подписка активируется сразу после покупки. Если PRO уже активен — продлим срок.
          </div>
        </div>
      </section>

      <style jsx>{`
        .pro {
          margin-top: 20px;
        }

        .pro-title {
          font-size: 20px;
          font-weight: 950;
          text-align: center;
          margin: 0 0 12px;
          color: #111827;
          letter-spacing: 0.4px;
        }

        .pro-card {
          border-radius: 22px;
          padding: 16px 14px 14px;
          border: 1px solid rgba(217, 119, 6, 0.5);
          background: radial-gradient(circle at top left, #fffbeb 0, #fef3c7 45%, #ffffff 92%);
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
        }

        .pro-badge {
          font-size: 16px;
          font-weight: 950;
          text-align: center;
          padding: 10px 0;
          border-radius: 18px;
          margin-bottom: 10px;
          border: 1px solid rgba(217, 119, 6, 0.8);
          background: rgba(254, 243, 199, 0.96);
          color: #b45309;
          letter-spacing: 0.3px;
        }

        .pro-subtitle {
          font-size: 13px;
          text-align: center;
          margin: 0 0 12px;
          color: rgba(55, 65, 81, 0.9);
          font-weight: 700;
        }

        .pro-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pro-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: #374151;
          line-height: 1.35;
        }

        .feat-icon {
          font-size: 16px;
          width: 20px;
          text-align: center;
          flex: 0 0 20px;
          margin-top: 1px;
        }

        .feat-icon.yes {
          color: #16a34a;
        }

        .feat-icon.no {
          color: #dc2626;
        }

        .feat-text {
          flex: 1 1 auto;
          min-width: 0;
        }

        /* ===== планы: как на скрине — вертикально, на всю ширину ===== */
        .pro-plans {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .plan {
          width: 100%;
          border-radius: 18px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: rgba(255, 255, 255, 0.78);
          padding: 10px 12px 10px;
          text-align: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
          position: relative;
          overflow: hidden;
        }

        .plan:active {
          transform: scale(0.99);
          opacity: 0.96;
        }

        .plan.is-active {
          border-color: rgba(217, 119, 6, 0.95);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 10px 22px rgba(217, 119, 6, 0.18);
        }

        .tagRow {
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          margin-bottom: 4px;
        }

        .tag {
          font-size: 11px;
          font-weight: 950;
          padding: 3px 9px;
          border-radius: 999px;
          white-space: nowrap;
          letter-spacing: 0.2px;
        }

        .tagPopular {
          border: 1px solid rgba(34, 197, 94, 0.35);
          background: rgba(34, 197, 94, 0.12);
          color: #166534;
        }

        .tagProfit {
          border: 1px solid rgba(217, 119, 6, 0.55);
          background: rgba(254, 243, 199, 0.9);
          color: #b45309;
        }

        .planTerm {
          font-size: 16px;
          font-weight: 950;
          color: #111827;
          letter-spacing: 0.4px;
        }

        .planPrice {
          margin-top: 2px;
          font-size: 18px;
          font-weight: 950;
          color: #111827;
          letter-spacing: -0.02em;
        }

        .planPer {
          margin-top: 3px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.65);
        }

        .planPer.is-empty {
          visibility: hidden;
        }

        /* ===== купить ===== */
        .pro-buy {
          margin-top: 12px;
          width: 100%;
          border: none;
          border-radius: 18px;
          padding: 14px 14px;
          font-size: 16px;
          font-weight: 950;
          color: #111827;
          cursor: pointer;
          background: linear-gradient(180deg, #fde68a 0%, #f59e0b 100%);
          box-shadow: 0 12px 20px rgba(217, 119, 6, 0.26);
        }

        .pro-buy:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .pro-footnote {
          margin-top: 10px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(55, 65, 81, 0.78);
          text-align: center;
          line-height: 1.35;
        }
      `}</style>
    </>
  );
}
