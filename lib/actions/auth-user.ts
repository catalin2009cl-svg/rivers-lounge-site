'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { scryptSync } from 'crypto';
import { getUserByEmail, getUsers, saveUsers } from '@/lib/server-data';
import type { User } from '@/lib/server-data';

function verifyPassword(password: string, hash: string): boolean {
  const [salt, stored] = hash.split(':');
  if (!salt || !stored) return false;
  try {
    const attempt = scryptSync(password, salt, 64).toString('hex');
    return attempt === stored;
  } catch {
    return false;
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getUserByEmail(email);
  if (!user || !user.isActive) return { success: false, error: 'Email sau parolă incorectă.' };
  if (!verifyPassword(password, user.passwordHash)) return { success: false, error: 'Email sau parolă incorectă.' };

  const cookieStore = await cookies();
  cookieStore.set('user_email', user.email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  // Track login activity for GDPR retention
  try {
    const users = await getUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (idx !== -1) {
      const now = new Date().toISOString();
      users[idx] = { ...users[idx], lastActivityAt: now, lastLoginAt: now };
      await saveUsers(users);
    }
  } catch { /* non-critical */ }

  // Pre-generate birthday discount code if in birthday window
  try {
    const { checkAndGenerateBirthdayDiscount } = await import('@/lib/actions/birthday');
    await checkAndGenerateBirthdayDiscount(user.id);
  } catch { /* non-critical */ }

  return { success: true };
}

export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('user_email');
  redirect('/cont/autentificare');
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('user_email')?.value;
    if (!email) return null;
    return getUserByEmail(email);
  } catch {
    return null;
  }
}
