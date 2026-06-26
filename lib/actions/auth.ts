'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash } from 'crypto';
import type { AdminRole } from '@/lib/auth';
import { getOperators, saveOperators } from '@/lib/server-data';

export async function loginAction(
  password: string,
  username?: string
): Promise<{ error?: string; name?: string }> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const operatorPassword = process.env.OPERATOR_PASSWORD;
  const operatorName = process.env.OPERATOR_NAME ?? 'Operator';
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!adminPassword || !secret) {
    return {
      error:
        'Configurație lipsă pe server. Adaugă ADMIN_PASSWORD și ADMIN_SESSION_SECRET în .env.local.',
    };
  }

  let role: AdminRole;
  let name: string;
  let operatorId: string | undefined;

  if (password === adminPassword && !username) {
    // ── Admin login (password only) ───────────────────────────────────────────
    role = 'admin';
    name = 'Administrator';
  } else if (username) {
    // ── Operator login (username + password) ─────────────────────────────────
    const operators = await getOperators();
    const op = operators.find(
      (o) => o.username.toLowerCase() === username.toLowerCase()
    );
    const passwordHash = createHash('sha256').update(password).digest('hex');
    if (!op || op.passwordHash !== passwordHash) {
      return { error: 'Date incorecte.' };
    }
    if (!op.isActive) {
      return { error: 'Contul de operator a fost dezactivat.' };
    }
    role = op.role === 'manager' ? 'manager' : 'operator';
    name = op.name;
    operatorId = op.id;

    // Update login history
    const now = new Date().toISOString();
    const idx = operators.findIndex((o) => o.id === op.id);
    operators[idx].lastLoginAt = now;
    operators[idx].loginHistory = [
      { loginAt: now },
      ...(operators[idx].loginHistory ?? []).slice(0, 49),
    ];
    await saveOperators(operators);
  } else if (operatorPassword && password === operatorPassword) {
    // ── Legacy env-var operator fallback ─────────────────────────────────────
    role = 'operator';
    name = operatorName;
  } else {
    return { error: 'Date incorecte.' };
  }

  const sessionPayload: Record<string, unknown> = {
    secret,
    role,
    name,
    loggedInAt: new Date().toISOString(),
  };
  if (operatorId) sessionPayload.operatorId = operatorId;

  const sessionData = JSON.stringify(sessionPayload);

  const cookieStore = await cookies();
  cookieStore.set('admin_session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return { name };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  redirect('/admin/login');
}
