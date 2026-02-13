/* path: app/hamburger/questions/page.tsx */
'use client';

import TopBarBack from '../../../components/TopBarBack';

export default function HamburgerQuestionsPage() {
  return (
    <main className="p">
      <TopBarBack />

      <h1 className="t">Вопросы</h1>
      <p className="s">Актуальные и архив</p>

      <div className="card">
        <div className="muted">Страница в разработке.</div>
      </div>

      <style jsx>{`
        .p {
          min-height: 100dvh;
          padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        }
        .t {
          margin: 6px 0 0;
          font-size: 22px;
          font-weight: 950;
          color: #111827;
        }
        .s {
          margin: 6px 0 12px;
          font-size: 13px;
          color: rgba(17, 24, 39, 0.7);
        }
        .card {
          border-radius: 18px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.92);
          padding: 14px;
          box-shadow: 0 10px 26px rgba(18, 28, 45, 0.06);
        }
        .muted {
          font-weight: 800;
          color: rgba(15, 23, 42, 0.65);
          font-size: 13px;
        }
      `}</style>
    </main>
  );
}
