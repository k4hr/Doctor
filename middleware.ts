// path: middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function withFrameHeaders(res: NextResponse) {
  res.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.vk.com https://*.vk.ru https://vk.com https://vk.ru"
  );
  res.headers.delete('X-Frame-Options'); // конфликтует с CSP
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}

// Канонизируем vk_* → строку "k=v&k2=v2" (по алфавиту) + sign в конце
function canonicalizeVkParams(sp: URLSearchParams): string {
  const entries = Array.from(sp.entries()).filter(
    ([k]) => k.startsWith('vk_') || k === 'sign'
  );
  const withoutSign = entries.filter(([k]) => k !== 'sign');
  withoutSign.sort(([a], [b]) => a.localeCompare(b));
  const qs = withoutSign.map(([k, v]) => `${k}=${v}`).join('&');
  const sign = sp.get('sign');
  return sign ? (qs ? `${qs}&sign=${sign}` : `sign=${sign}`) : qs;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // ---------- API: пробрасываем заголовки ----------
  if (pathname.startsWith('/api')) {
    const requestHeaders = new Headers(req.headers);

    // Telegram initData: нормализуем разные варианты
    const tgHeader =
      requestHeaders.get('x-telegram-init-data') ||
      requestHeaders.get('x-tg-init-data') ||
      requestHeaders.get('X-Telegram-Init-Data') ||
      requestHeaders.get('X-Tg-Init-Data') ||
      requestHeaders.get('x-init-data') || // исторический
      '';
    if (tgHeader) requestHeaders.set('x-telegram-init-data', tgHeader);

    // VK launch params — из заголовка или из куки
    if (!requestHeaders.get('x-vk-params')) {
      const fromCookie = req.cookies.get('vk_params')?.value;
      if (fromCookie) requestHeaders.set('x-vk-params', fromCookie);
    }

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    return withFrameHeaders(res);
  }

  const res = NextResponse.next();

  // Сохраняем vk_* из query (hash сервер не видит)
  const hasVkParamsInQuery = Array.from(searchParams.keys()).some(
    (k) => k.startsWith('vk_') || k === 'sign'
  );

  if (hasVkParamsInQuery) {
    const canonical = canonicalizeVkParams(searchParams);
    if (canonical) {
      res.cookies.set('vk_params', canonical, {
        path: '/',
        httpOnly: false,
        sameSite: 'none',
        secure: true,
        maxAge: 60 * 60 * 24, // сутки
      });
    }
  }

  // НИКАКИХ редиректов, просто пускаем юзера на страницу
  return withFrameHeaders(res);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next|favicon.ico|assets|public|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml)).*)',
  ],
};
