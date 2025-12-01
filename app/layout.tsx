/* path: app/layout.tsx */
import './globals.css';
import type { Metadata, Viewport } from 'next';

import TwaBootstrap from '../components/TwaBootstrap';
import GlobalSafeTop from '../components/GlobalSafeTop';
import TMAInit from '../components/TMAInit';
import VKBootstrap from '../components/VKBootstrap';

/** Всегда СВЕТЛАЯ тема + отключаем масштабирование (iOS zoom fix) */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#F5F7FA',
};

export const metadata: Metadata = {
  title: 'ВРАЧИ.ТУТ',
  description: 'Онлайн-консультации с врачами в Telegram Mini App',
  themeColor: '#F5F7FA',
  other: {
    'color-scheme': 'light',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="light">
      <head>
        {/* Дублируем meta viewport для совместимости с WebView VK/Telegram */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#F5F7FA" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Шрифты: Manrope (основной), Montserrat — для крупных заголовков */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Montserrat:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: '#F5F7FA', color: '#0B0C10' }}>
        {/* Глобальный фон (если он описан в globals.css) */}
        <div className="lm-bg" />

        {/* Безопасная зона под хедер TWA */}
        <GlobalSafeTop />

        {/* Инициализация Telegram WebApp: ready()+expand() */}
        <TMAInit />

        {/* Контент приложения (обёрнут в VKBootstrap и TwaBootstrap) */}
        <VKBootstrap>
          <div className="lm-page">
            <TwaBootstrap>{children}</TwaBootstrap>
          </div>
        </VKBootstrap>
      </body>
    </html>
  );
}
