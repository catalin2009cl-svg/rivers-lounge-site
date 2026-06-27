import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasPermission, type Permission } from '@/lib/permissions';

// Required permission to enter each admin sub-section.
// Checked by prefix: /admin/meniu matches /admin/meniu and /admin/meniu/edit/123
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
  ['/admin/mentenanta',     'mentenanta.view'],
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static asset files (images, fonts, etc. served from public/)
  if (pathname.includes('.') && !pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Login and access-denied are always accessible — check before everything else
  if (
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/admin/access-denied')
  ) {
    return NextResponse.next();
  }

  // Parse session once — reused for both maintenance bypass and admin auth
  const secret = process.env.ADMIN_SESSION_SECRET;
  const sessionCookie = request.cookies.get('admin_session');
  const session =
    secret && sessionCookie?.value
      ? parseSession(sessionCookie.value, secret)
      : null;
  const isLoggedIn = session !== null;

  // ── Maintenance mode check ────────────────────────────────────────────────
  // Only applies to public (non-admin) routes.
  // Any valid session (admin, manager, operator) bypasses maintenance entirely.
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/mentenanta') && !isLoggedIn) {
    try {
      const origin = request.nextUrl.origin;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${origin}/api/maintenance`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = (await res.json()) as { enabled: boolean };
        if (data.enabled) {
          return NextResponse.redirect(new URL('/mentenanta', request.url));
        }
      }
    } catch {
      // Fail open — if the check fails, let the request through
    }
  }

  // Public routes pass after maintenance check
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // ── Admin auth check ──────────────────────────────────────────────────────
  if (!isLoggedIn) {
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
  matcher: ['/((?!_next|api|favicon\\.ico).*)'],
};
