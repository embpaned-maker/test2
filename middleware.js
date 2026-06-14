import { NextResponse } from 'next/server';

const locales = ['ro', 'ru'];
const defaultLocale = 'ro';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check if the pathname is missing a locale
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    return NextResponse.redirect(
      new URL(
        `/${defaultLocale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
        request.url
      )
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next), API routes, and public files
    '/((?!_next|api|favicon.ico|logo.*|images|.*\\.).*)',
  ],
};
