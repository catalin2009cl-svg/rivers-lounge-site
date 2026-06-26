'use server';

import { revalidatePath } from 'next/cache';
import { getSpecialEvents, saveSpecialEvents, type SpecialEvent } from '@/lib/server-data';

type ActionResult<T = void> = T extends void
  ? { success: boolean; error?: string }
  : { success: boolean; data?: T; error?: string };

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function createSpecialEvent(
  event: Omit<SpecialEvent, 'id'>
): Promise<ActionResult<SpecialEvent>> {
  try {
    const events = await getSpecialEvents();
    const newEvent: SpecialEvent = { ...event, id: generateId() };
    await saveSpecialEvents([...events, newEvent]);
    revalidatePath('/');
    revalidatePath('/cabana');
    revalidatePath('/admin/evenimente');
    return { success: true, data: newEvent };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateSpecialEvent(
  id: string,
  updates: Partial<Omit<SpecialEvent, 'id'>>
): Promise<ActionResult<SpecialEvent>> {
  try {
    const events = await getSpecialEvents();
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1) return { success: false, error: 'Evenimentul nu a fost găsit.' };
    const updated = { ...events[idx], ...updates };
    events[idx] = updated;
    await saveSpecialEvents(events);
    revalidatePath('/');
    revalidatePath('/cabana');
    revalidatePath('/admin/evenimente');
    return { success: true, data: updated };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteSpecialEvent(id: string): Promise<ActionResult> {
  try {
    const events = await getSpecialEvents();
    await saveSpecialEvents(events.filter((e) => e.id !== id));
    revalidatePath('/');
    revalidatePath('/cabana');
    revalidatePath('/admin/evenimente');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
