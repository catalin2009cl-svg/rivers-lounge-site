'use server';

import { getSocialSettings, saveSocialSettings } from '@/lib/server-data';
import { revalidatePath } from 'next/cache';
import type { SocialSettings } from '@/lib/server-data';

export async function updateSocialSettings(
  settings: SocialSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    await saveSocialSettings(settings);
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
