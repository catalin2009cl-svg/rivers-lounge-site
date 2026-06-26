'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getUsers, saveUsers } from '@/lib/server-data';

export type BirthdayOffer = {
  hasBirthday: boolean;
  code?: string;
  message?: string;
  discountValue?: number;
};

// TODO: Re-enable when loyalty system launches
export async function checkAndGenerateBirthdayDiscount(
  _userId: string
): Promise<BirthdayOffer | null> {
  return null;
}

export async function saveBirthday(
  birthday: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('user_email')?.value;
    if (!email) return { success: false, error: 'Trebuie să fii autentificat.' };

    const users = await getUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return { success: false, error: 'Utilizatorul nu există.' };

    users[idx] = { ...users[idx], birthday };
    await saveUsers(users);
    revalidatePath('/cont/setari');
    revalidatePath('/cont');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
