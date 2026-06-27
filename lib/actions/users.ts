'use server';

import { randomBytes, scryptSync } from 'crypto';
import { put } from '@vercel/blob';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getUsers, saveUsers, getUserByEmail, getOrders, saveOrders } from '@/lib/server-data';
import type { Order } from '@/lib/server-data';
import { checkUserRetention } from '@/lib/data-retention';
import type { RetentionCheckResult } from '@/lib/data-retention';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyScrypt(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  try {
    return scryptSync(password, salt, 64).toString('hex') === hash;
  } catch {
    return false;
  }
}

async function getLoggedInEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('user_email')?.value ?? null;
}

export async function createUser(data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const existing = await getUserByEmail(data.email);
    if (existing) return { success: false, error: 'Un cont cu acest email există deja.' };

    const users = await getUsers();
    const now = new Date().toISOString();
    const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
    const id = `USR-${Date.now()}-${suffix}`;

    await saveUsers([
      {
        id,
        createdAt: now,
        lastLoginAt: now,
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash: hashPassword(data.password),
        isActive: true,
        isVerified: false,
        role: 'client',
        totalOrders: 0,
        totalSpent: 0,
        adminNote: '',
      },
      ...users,
    ]);
    revalidatePath('/admin/utilizatori');
    return { success: true, userId: id };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateUser(
  id: string,
  data: Partial<{ name: string; email: string; phone: string; isActive: boolean; adminNote: string }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const users = await getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return { success: false, error: 'Utilizatorul nu există.' };
    users[idx] = { ...users[idx], ...data };
    await saveUsers(users);
    revalidatePath('/admin/utilizatori');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateAdminNote(
  id: string,
  note: string
): Promise<{ success: boolean; error?: string }> {
  return updateUser(id, { adminNote: note });
}

export async function toggleUserActive(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateUser(id, { isActive });
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const orders = await getOrders();
  return orders.filter((o) => o.userId === userId);
}

export async function updateMyProfile(
  data: { name: string; phone: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const email = await getLoggedInEmail();
    if (!email) return { success: false, error: 'Trebuie să fii autentificat.' };
    const users = await getUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return { success: false, error: 'Utilizatorul nu există.' };
    users[idx] = { ...users[idx], name: data.name.trim(), phone: data.phone.trim() };
    await saveUsers(users);
    revalidatePath('/cont/setari');
    revalidatePath('/cont');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const email = await getLoggedInEmail();
    if (!email) return { success: false, error: 'Trebuie să fii autentificat.' };
    const users = await getUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return { success: false, error: 'Utilizatorul nu există.' };
    if (!verifyScrypt(currentPassword, users[idx].passwordHash)) {
      return { success: false, error: 'Parola actuală este incorectă.' };
    }
    users[idx].passwordHash = hashPassword(newPassword);
    await saveUsers(users);
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  const email = await getLoggedInEmail();
  if (!email) return { success: false, error: 'Trebuie să fii autentificat.' };
  try {
    const users = await getUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return { success: false, error: 'Utilizatorul nu există.' };
    users[idx].isActive = false;
    await saveUsers(users);
  } catch (e) {
    return { success: false, error: String(e) };
  }
  const cookieStore = await cookies();
  cookieStore.delete('user_email');
  redirect('/cont/autentificare');
}

export async function updateUserActivity(
  lookup: { userId?: string; email?: string },
  opts?: { updateLogin?: boolean }
): Promise<void> {
  try {
    const users = await getUsers();
    const idx = lookup.userId
      ? users.findIndex((u) => u.id === lookup.userId)
      : lookup.email
      ? users.findIndex((u) => u.email.toLowerCase() === lookup.email!.toLowerCase())
      : -1;
    if (idx === -1) return;
    const now = new Date().toISOString();
    users[idx] = {
      ...users[idx],
      lastActivityAt: now,
      ...(opts?.updateLogin ? { lastLoginAt: now } : {}),
    };
    await saveUsers(users);
  } catch {
    // Non-critical — activity tracking must never break the main flow
  }
}

export async function getRetentionReport(): Promise<RetentionCheckResult[]> {
  const users = await getUsers();
  return users
    .filter((u) => u.role === 'client')
    .map(checkUserRetention)
    .sort((a, b) => a.daysUntilDeletion - b.daysUntilDeletion);
}

export async function markRetentionNotified(
  userId: string
): Promise<{ success: boolean }> {
  try {
    const users = await getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { success: false };
    users[idx] = { ...users[idx], retentionNotifiedAt: new Date().toISOString() };
    await saveUsers(users);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function resetUserActivity(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const users = await getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { success: false, error: 'Utilizatorul nu există.' };
    const now = new Date().toISOString();
    users[idx] = { ...users[idx], lastActivityAt: now, retentionNotifiedAt: undefined };
    await saveUsers(users);
    revalidatePath('/admin/utilizatori');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function anonymizeUserOrders(userEmail: string): Promise<void> {
  const orders = await getOrders();
  const norm = userEmail.toLowerCase();
  let dirty = false;
  const updated = orders.map((o) => {
    if ((o.userEmail?.toLowerCase() ?? '') !== norm) return o;
    dirty = true;
    return {
      ...o,
      name: 'Utilizator șters',
      phone: '***',
      address: o.address ? '***' : o.address,
      addressDetails: o.addressDetails ? '***' : o.addressDetails,
      userEmail: 'deleted@riverslounge.ro',
    };
  });
  if (dirty) await saveOrders(updated);
}

export async function verifyUser(
  userId: string,
  adminName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const users = await getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { success: false, error: 'Utilizatorul nu există.' };
    users[idx] = {
      ...users[idx],
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      verifiedBy: adminName,
    };
    await saveUsers(users);
    revalidatePath('/admin/utilizatori');
    revalidatePath('/cont');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function revokeVerification(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const users = await getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { success: false, error: 'Utilizatorul nu există.' };
    users[idx] = {
      ...users[idx],
      isVerified: false,
      verifiedAt: undefined,
      verifiedBy: undefined,
    };
    await saveUsers(users);
    revalidatePath('/admin/utilizatori');
    revalidatePath('/cont');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteInactiveUsers(
  userIds: string[]
): Promise<{ deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;
  try {
    const users = await getUsers();
    const toDelete = users.filter((u) => userIds.includes(u.id));

    for (const user of toDelete) {
      try {
        await anonymizeUserOrders(user.email);
      } catch (e) {
        errors.push(`Eroare anonimizare comenzi ${user.email}: ${String(e)}`);
      }
    }

    const remaining = users.filter((u) => !userIds.includes(u.id));
    await saveUsers(remaining);
    deleted = toDelete.length;
    revalidatePath('/admin/utilizatori');
  } catch (e) {
    errors.push(String(e));
  }
  return { deleted, errors };
}

export async function uploadAvatar(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const email = await getLoggedInEmail();
  if (!email) return { error: 'Trebuie să fii autentificat.' };

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Niciun fișier selectat.' };

  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
  if (!ALLOWED.includes(file.type)) return { error: 'Tip nepermis. Folosiți JPG, PNG sau WebP.' };
  if (file.size > 5 * 1024 * 1024) return { error: 'Fișierul este prea mare (max 5 MB).' };

  try {
    const users = await getUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return { error: 'Utilizatorul nu există.' };

    const userId = users[idx].id;
    const pathname = `avatars/${userId}-${Date.now()}.jpg`;
    const blob = await put(pathname, file, { access: 'public' });
    const url = blob.url;
    users[idx] = { ...users[idx], avatar: url };
    await saveUsers(users);
    revalidatePath('/cont');
    revalidatePath('/cont/setari');
    return { url };
  } catch (e) {
    return { error: `Eroare la salvare: ${String(e)}` };
  }
}

export async function getSavedAddresses(): Promise<
  { address: string; city: string; addressDetails: string; count: number }[]
> {
  const email = await getLoggedInEmail();
  if (!email) return [];
  const orders = await getOrders();
  const norm = email.toLowerCase();
  const counts: Record<string, { address: string; city: string; addressDetails: string; count: number }> = {};
  for (const o of orders) {
    if (o.userEmail?.toLowerCase() !== norm || o.orderType !== 'livrare' || !o.address) continue;
    const key = [o.address, o.addressDetails, o.city].filter(Boolean).join('||');
    if (!counts[key]) counts[key] = { address: o.address, city: o.city ?? '', addressDetails: o.addressDetails ?? '', count: 0 };
    counts[key].count++;
  }
  return Object.values(counts).sort((a, b) => b.count - a.count);
}
