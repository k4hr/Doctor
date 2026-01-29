/* path: middleware.ts */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function withFrameHeaders(res: NextResponse) {
  res.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org https://t.me"
  );

  // X-Frame-Options конфликтует с frame-ancestors, убираем
  res.headers.delete('X-Frame-Options');

  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Вариант B: upload НЕ обрабатываем middleware-ом вообще.
  // ВАЖНО: тут именно NextResponse.next() БЕЗ кастомных request headers и БЕЗ frame headers.
  // Любое вмешательство middleware в этот маршрут может включить body buffering/лимиты.
  if (pathname === '/api/question/upload') {
    return NextResponse.next();
  }

  // ----- API: прокидываем Telegram initData в единый заголовок -----
  if (pathname.startsWith('/api')) {
    const requestHeaders = new Headers(req.headers);

    const tgHeader =
      requestHeaders.get('x-telegram-init-data') ||
      requestHeaders.get('x-tg-init-data') ||
      requestHeaders.get('X-Telegram-Init-Data') ||
      requestHeaders.get('X-Tg-Init-Data') ||
      requestHeaders.get('x-init-data') ||
      '';

    if (tgHeader) {
      requestHeaders.set('x-telegram-init-data', tgHeader);
    }

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    return withFrameHeaders(res);
  }

  // Статические/страничные запросы — просто пропускаем + заголовки для Telegram Web
  const res = NextResponse.next();
  return withFrameHeaders(res);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next|favicon.ico|assets|public|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml)).*)',
  ],
};
