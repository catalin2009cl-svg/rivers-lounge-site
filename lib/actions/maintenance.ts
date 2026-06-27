'use server';

import { getSettings, saveSettings } from '@/lib/server-data';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function toggleMaintenanceMode(
  enabled: boolean,
  title?: string,
  message?: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  try {
    const settings = await getSettings();
    await saveSettings({
      ...settings,
      maintenanceMode: {
        enabled,
        title: title ?? settings.maintenanceMode?.title ?? 'Revenim în curând',
        message:
          message ??
          settings.maintenanceMode?.message ??
          'Lucrăm la ceva deosebit pentru voi. Ne întoarcem în curând!',
      },
    });
    revalidatePath('/admin');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
