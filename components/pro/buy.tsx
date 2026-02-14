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
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <div className="pro-plans">
            {PLANS.map((p) => {
              const active = p.id === plan;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`pro-plan ${active ? 'is-active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    haptic('light');
                    setPlan(p.id);
                  }}
                >
                  <div className="pro-plan-top">
                    <span className="pro-plan-label">{p.label}</span>

                    {/* ✅ фиксируем место под тег, чтобы все карточки были одинаковой высоты */}
                    <span className={`pro-plan-tag ${p.id === 'Y1' ? 'is-show' : 'is-hide'}`}>
                      выгодно
                    </span>
                  </div>

                  <div className="pro-plan-price">{p.priceRub} ₽</div>
                </button>
              );
            })}
          </div>

          <div className="pro-bottom">
            <div className="pro-price">
              <span className="pro-price-big">{current.priceRub} ₽</span>
              <span className="pro-price-small"> / {current.label}</span>
            </div>

            <button type="button" className="pro-buy" onClick={onBuy} disabled={loading}>
              {loading ? 'Создаём…' : 'Купить PRO'}
            </button>
          </div>

          <div className="pro-footnote">Подписка активируется сразу после покупки. Если PRO уже активен — продлим срок.</div>
        </div>
      </section>

      <style jsx>{`
        .pro {
          margin-top: 20px;
        }

        .pro-title {
          font-size: 22px;
          font-weight: 900;
          text-align: center;
          margin-bottom: 14px;
          color: #111827;
          letter-spacing: 0.3px;
        }

        .pro-card {
          border-radius: 22px;
          padding: 18px 16px 16px;
          border: 1px solid rgba(217, 119, 6, 0.5);
          background: radial-gradient(circle at top left, #fffbeb 0, #fef3c7 45%, #ffffff 90%);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
        }

        .pro-badge {
          font-size: 18px;
          font-weight: 900;
          text-align: center;
          padding: 8px 0;
          border-radius: 18px;
          margin-bottom: 10px;
          border: 1px solid rgba(217, 119, 6, 0.8);
          background: rgba(254, 243, 199, 0.96);
          color: #b45309;
        }

        .pro-subtitle {
          font-size: 14px;
          text-align: center;
          margin: 0 0 14px;
          color: rgba(55, 65, 81, 0.9);
          font-weight: 600;
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
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #374151;
        }

        .feat-icon {
          font-size: 16px;
          width: 20px;
          text-align: center;
        }

        .feat-icon.yes {
          color: #16a34a;
        }

        .feat-icon.no {
          color: #dc2626;
        }

        .pro-plans {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        /* ✅ одинаковые квадратики */
        .pro-plan {
          border-radius: 16px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.75);
          padding: 10px 10px 9px;
          text-align: left;
          cursor: pointer;
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);

          width: 100%;
          min-height: 66px; /* фиксируем высоту, чтобы все были одинаковые */
          display: grid;
          align-content: start;
          gap: 4px;

          -webkit-tap-highlight-color: transparent;
        }

        .pro-plan:active {
          transform: scale(0.99);
          opacity: 0.96;
        }

        .pro-plan.is-active {
          border-color: rgba(217, 119, 6, 0.8);
          box-shadow: 0 8px 18px rgba(217, 119, 6, 0.18);
          background: rgba(255, 255, 255, 0.9);
        }

        /* ✅ одинаковая “шапка” у всех */
        .pro-plan-top {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 8px;
          min-height: 18px; /* фиксируем строку под тег */
          min-width: 0;
        }

        /* ✅ одинаковые шрифты */
        .pro-plan-label {
          font-size: 13px;
          font-weight: 800;
          color: #111827;

          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pro-plan-tag {
          font-size: 11px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid rgba(217, 119, 6, 0.75);
          color: #b45309;
          background: rgba(254, 243, 199, 0.9);
          white-space: nowrap;

          /* фиксируем “габарит” тега, даже когда скрыт */
          height: 18px;
          display: inline-flex;
          align-items: center;
        }

        .pro-plan-tag.is-hide {
          visibility: hidden; /* место остаётся => все карточки одинаковые */
        }

        .pro-plan-tag.is-show {
          visibility: visible;
        }

        .pro-plan-price {
          font-size: 14px;
          font-weight: 900;
          color: #111827;
          line-height: 1.2;
        }

        .pro-bottom {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .pro-price {
          display: flex;
          align-items: baseline;
          gap: 6px;
          min-width: 0;
        }

        .pro-price-big {
          font-size: 20px;
          font-weight: 900;
          color: #111827;
          white-space: nowrap;
        }

        .pro-price-small {
          font-size: 13px;
          font-weight: 700;
          color: rgba(55, 65, 81, 0.85);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pro-buy {
          border: none;
          border-radius: 16px;
          padding: 12px 14px;
          font-size: 15px;
          font-weight: 900;
          color: #111827;
          cursor: pointer;
          background: linear-gradient(180deg, #fde68a 0%, #f59e0b 100%);
          box-shadow: 0 10px 18px rgba(217, 119, 6, 0.25);
          min-width: 140px;
        }

        .pro-buy:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .pro-footnote {
          margin-top: 10px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(55, 65, 81, 0.8);
          text-align: center;
        }
      `}</style>
    </>
  );
}
