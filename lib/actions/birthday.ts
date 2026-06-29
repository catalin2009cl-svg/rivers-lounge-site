'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getUsers, saveUsers } from '@/lib/server-data';
import { prisma } from '@/lib/prisma';

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

export async function saveBirthDate(
  month: string,
  day: string,
  year: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('user_email')?.value;
    if (!email) return { success: false, error: 'Trebuie să fii autentificat.' };

    const yearNum = Number(year);
    const monthNum = Number(month);
    const dayNum = Number(day);
    const currentYear = new Date().getFullYear();

    if (!yearNum || yearNum < 1920 || yearNum > currentYear - 5) {
      return { success: false, error: 'An de naștere invalid.' };
    }
    if (!monthNum || monthNum < 1 || monthNum > 12) {
      return { success: false, error: 'Lună invalidă.' };
    }
    if (!dayNum || dayNum < 1 || dayNum > 31) {
      return { success: false, error: 'Zi invalidă.' };
    }

    const birthDate = new Date(yearNum, monthNum - 1, dayNum);
    const mmdd = `${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // Save MM-DD to legacy birthday field AND full date to Prisma
    const users = await getUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1) {
      users[idx] = { ...users[idx], birthday: mmdd };
      await saveUsers(users);
    }

    await prisma.user.updateMany({
      where: { email: email.toLowerCase() },
      data: { birthday: mmdd, birthDate },
    });

    revalidatePath('/cont/setari');
    revalidatePath('/cont');
    revalidatePath('/cont/fidelizare');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
