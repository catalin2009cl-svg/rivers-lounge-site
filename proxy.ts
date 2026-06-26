import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasPermission, type Permission } from '@/lib/permissions';

// Required permission to enter each admin sub-section.
// Checked by prefix: /admin/meniu matches both /admin/meniu and /admin/meniu/edit/123
const ROUTE_PERMISSIONS: Array<[string, Permission]> = [
  ['/admin/meniu',          'meniu.view'],
  ['/admin/noutati',        'noutati.view'],
  ['/admin/evenimente',     'evenimente.view'],
  ['/admin/cabana-pachete', 'cabana.view'],
  ['/admin/media',          'media.view'],
  ['/admin/setari',         'setari.view'],
  ['/admin/utilizatori',    'utilizatori.view'],
  ['/admin/social',         'social.view'],
  ['/admin/arhiva',         'arhiva.view'],
  ['/admin/popup',          'popup.view'],
];

function parseSession(
  cookieValue: string,
  secret: string
): { role: string; name: string } | null {
  try {
    const parsed = JSON.parse(cookieValue);
    if (parsed.secret !== secret) return null;
    return { role: parsed.role ?? 'admin', name: parsed.name ?? 'Administrator' };
  } catch {
    // Legacy plain-secret format
    if (cookieValue === secret) return { role: 'admin', name: 'Administrator' };
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes; login and access-denied pages are exempt
  if (!pathname.startsWith('/admin') || pathname.startsWith('/admin/login') || pathname.startsWith('/admin/access-denied')) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  const sessionCookie = request.cookies.get('admin_session');

  // Not authenticated → redirect to login
  if (!secret || !sessionCookie?.value) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const session = parseSession(sessionCookie.value, secret);
  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Check per-route permission
  const matchedRoute = ROUTE_PERMISSIONS.find(
    ([path]) => pathname === path || pathname.startsWith(path + '/')
  );
  if (matchedRoute) {
    const [, permission] = matchedRoute;
    if (!hasPermission(session.role, permission)) {
      return NextResponse.redirect(new URL('/admin/access-denied', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
