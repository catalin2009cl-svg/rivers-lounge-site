'use server';

import { revalidatePath } from 'next/cache';
import { getMenuItems, saveMenuItems, type MenuProduct } from '@/lib/server-data';

type ActionResult<T = void> = T extends void
  ? { success: boolean; error?: string }
  : { success: boolean; data?: T; error?: string };

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function createMenuItem(
  item: Omit<MenuProduct, 'id'>
): Promise<ActionResult<MenuProduct>> {
  try {
    const items = await getMenuItems();
    const newItem: MenuProduct = { ...item, id: generateId() };
    await saveMenuItems([...items, newItem]);
    revalidatePath('/');
    revalidatePath('/meniu');
    revalidatePath('/admin/meniu');
    return { success: true, data: newItem };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateMenuItem(
  id: string,
  updates: Partial<Omit<MenuProduct, 'id'>>
): Promise<ActionResult<MenuProduct>> {
  try {
    const items = await getMenuItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return { success: false, error: 'Produsul nu a fost găsit.' };
    const updated = { ...items[idx], ...updates };
    items[idx] = updated;
    await saveMenuItems(items);
    revalidatePath('/');
    revalidatePath('/meniu');
    revalidatePath('/admin/meniu');
    return { success: true, data: updated };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateMenuItemStatus(
  id: string,
  status: 'disponibil' | 'indisponibil' | 'retras' | 'draft'
): Promise<ActionResult> {
  return updateMenuItem(id, { status, available: status === 'disponibil' });
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  try {
    const items = await getMenuItems();
    await saveMenuItems(items.filter((i) => i.id !== id));
    revalidatePath('/');
    revalidatePath('/meniu');
    revalidatePath('/admin/meniu');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
