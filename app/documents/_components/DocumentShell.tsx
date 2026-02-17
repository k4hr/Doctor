/* path: app/documents/_components/DocumentShell.tsx */
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

function tgBack(show: boolean) {
  try {
    const tg = (window as any)?.Telegram?.WebApp;
    if (!tg?.BackButton) return;
    if (show) tg.BackButton.show();
    else tg.BackButton.hide();
  } catch {}
}

type Crumb = { href: string; label: string };

export default function DocumentShell({
  title,
  subtitle,
  updatedAt,
  crumbs,
  children,
}: {
  title: string;
  subtitle?: string;
  updatedAt?: string;
  crumbs?: Crumb[];
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);

  const resolvedCrumbs = useMemo<Crumb[]>(() => {
    const base: Crumb[] = [{ href: '/documents', label: 'Документы' }];
    if (!crumbs?.length) return base;
    return [...base, ...crumbs];
  }, [crumbs]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    tgBack(true);
    const tg = (window as any)?.Telegram?.WebApp;
    const handler = () => {
      haptic('light');
      if (window.history.length > 1) window.history.back();
      else window.location.href = '/documents';
    };
    try {
      tg?.BackButton?.onClick?.(handler);
    } catch {}

    return () => {
      try {
        tg?.BackButton?.offClick?.(handler);
      } catch {}
      tgBack(false);
    };
  }, []);

  const onBackClick = () => {
    haptic('light');
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/documents';
  };

  return (
    <>
      <div className="doc-root">
        <header className={`doc-top ${scrolled ? 'doc-top--scrolled' : ''}`}>
          <button type="button" className="doc-back" onClick={onBackClick}>
            ←
          </button>

          <div className="doc-topinfo">
            <div className="doc-crumbs" aria-label="Навигация">
              {resolvedCrumbs.map((c, i) => (
                <span key={c.href} className="doc-crumb">
                  <Link
                    href={c.href}
                    className="doc-crumb-link"
                    onClick={() => haptic('light')}
                  >
                    {c.label}
                  </Link>
                  {i < resolvedCrumbs.length - 1 ? (
                    <span className="doc-crumb-sep">/</span>
                  ) : null}
                </span>
              ))}
            </div>

            <div className="doc-title">{title}</div>

            {(subtitle || updatedAt) && (
              <div className="doc-sub">
                {subtitle ? <span>{subtitle}</span> : null}
                {subtitle && updatedAt ? <span className="doc-dot">•</span> : null}
                {updatedAt ? <span>Редакция: {updatedAt}</span> : null}
              </div>
            )}
          </div>

          <div className="doc-brand">
            <span className="brand">
              <span className="brand-main">ВРАЧИ</span>
              <span className="brand-dot">.</span>
              <span className="brand-accent">ТУТ</span>
            </span>
          </div>
        </header>

        <main className="doc-main">
          <article className="doc-card">{children}</article>

          <footer className="doc-footer">
            <div className="doc-footer-line" />
            <div className="doc-footer-text">
              Поддержка: <a href="mailto:vrachi.tut@yandex.ru">vrachi.tut@yandex.ru</a>
            </div>
          </footer>
        </main>
      </div>

      <style jsx>{`
        .doc-root {
          min-height: 100vh;
          background: linear-gradient(180deg, #f6f8fb 0%, #ffffff 60%);
          padding-bottom: 36px;
          font-family: Montserrat, Manrope, system-ui, -apple-system, 'Segoe UI',
            sans-serif;
          color: #111827;
        }

        .doc-top {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 12px;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
          transition: box-shadow 160ms ease, background 160ms ease;
        }

        .doc-top--scrolled {
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.9);
        }

        .doc-back {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #ffffff;
          color: #111827;
          font-size: 18px;
          font-weight: 900;
          display: grid;
          place-items: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
        }

        .doc-back:active {
          transform: scale(0.98);
        }

        .doc-topinfo {
          flex: 1;
          min-width: 0;
        }

        .doc-crumbs {
          font-size: 12px;
          color: rgba(17, 24, 39, 0.55);
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          line-height: 1.2;
          margin-bottom: 2px;
        }

        .doc-crumb-link {
          color: rgba(17, 24, 39, 0.65);
          text-decoration: none;
          font-weight: 700;
        }
        .doc-crumb-link:active {
          opacity: 0.7;
        }
        .doc-crumb-sep {
          margin-left: 6px;
          color: rgba(17, 24, 39, 0.35);
        }

        .doc-title {
          font-size: 16px;
          font-weight: 900;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .doc-sub {
          margin-top: 4px;
          font-size: 12px;
          color: rgba(17, 24, 39, 0.6);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .doc-dot {
          opacity: 0.6;
        }

        .doc-brand {
          flex: none;
          padding-left: 6px;
          display: none;
        }

        @media (min-width: 520px) {
          .doc-brand {
            display: block;
          }
        }

        .brand {
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 0.2px;
          user-select: none;
        }
        .brand-main,
        .brand-dot {
          color: #111827;
        }
        .brand-accent {
          color: #24c768;
        }

        .doc-main {
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
          padding: 12px 12px 0;
        }

        .doc-card {
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 20px;
          padding: 16px 14px 20px;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
        }

        .doc-footer {
          margin-top: 14px;
          padding: 0 6px;
        }
        .doc-footer-line {
          height: 1px;
          background: rgba(15, 23, 42, 0.08);
          margin: 10px 0;
        }
        .doc-footer-text {
          font-size: 12px;
          color: rgba(17, 24, 39, 0.6);
        }
        .doc-footer-text a {
          color: rgba(17, 24, 39, 0.8);
          font-weight: 700;
          text-decoration: none;
        }
      `}</style>
    </>
  );
}
