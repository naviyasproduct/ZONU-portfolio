import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow the login page without admin cookie.
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  // Protect all admin/manage screens.
  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/thoughts/admin') ||
    pathname.startsWith('/thoughts/manage') ||
    /^\/thoughts\/.+\/edit$/.test(pathname) ||
    pathname.startsWith('/research/admin') ||
    pathname.startsWith('/research/manage') ||
    pathname.startsWith('/timeline/manage') ||
    /^\/research\/.+\/edit$/.test(pathname);

  if (isProtected) {
    const cookie = request.cookies.get('admin-authenticated');
    if (!cookie || cookie.value !== 'true') {
      const url = new URL('/admin/login', request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/thoughts/admin/:path*',
    '/thoughts/manage',
    '/thoughts/:id/edit',
    '/research/admin/:path*',
    '/research/manage',
    '/research/:id/edit',
    '/timeline/manage',
  ],
};
