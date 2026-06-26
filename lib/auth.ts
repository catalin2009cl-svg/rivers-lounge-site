import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdminRole = 'admin' | 'manager' | 'operator';

export interface AdminSession {
  role: AdminRole;
  name: string;
  loggedInAt: string;
  operatorId?: string;
}

// ── Internal cookie parsing ───────────────────────────────────────────────────

function parseSessionCookie(value: string, secret: string): AdminSession | null {
  try {
    const parsed = JSON.parse(value);
    if (parsed.secret !== secret) return null;
    const role: AdminRole =
      parsed.role === 'operator' ? 'operator' :
      parsed.role === 'manager'  ? 'manager'  : 'admin';
    return {
      role,
      name: parsed.name ?? 'Administrator',
      loggedInAt: parsed.loggedInAt ?? '',
      operatorId: parsed.operatorId,
    };
  } catch {
    // Legacy plain-secret format — treat as admin
    if (value === secret) {
      return { role: 'admin', name: 'Administrator', loggedInAt: '' };
    }
    return null;
  }
}

// ── Public helpers ────────────────────────────────────────────────────────────

export async function getSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('admin_session');
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret || !cookie?.value) return null;
    return parseSessionCookie(cookie.value, secret);
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return session;
}

export async function requireRole(allowedRoles: AdminRole[]): Promise<AdminSession> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) redirect('/admin?acces=interzis');
  return session;
}
