'use server';

import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { getCabanaGallery, saveCabanaGallery, getRiversLandGallery, saveRiversLandGallery, getRiversMarinaGallery, saveRiversMarinaGallery } from '@/lib/server-data';
import type { CabanaPhoto, RiversLandPhoto, RiversMarinaPhoto } from '@/lib/server-data';
import { revalidatePath } from 'next/cache';

export async function uploadCabanaPhoto(
  formData: FormData
): Promise<{ photo: CabanaPhoto } | { error: string }> {
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Niciun fișier selectat.' };

  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
  if (!ALLOWED.includes(file.type)) return { error: 'Tip nepermis. Folosiți JPG, PNG sau WebP.' };
  if (file.size > 10 * 1024 * 1024) return { error: 'Fișierul este prea mare (max 10 MB).' };

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `cabana-${Date.now()}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'images', 'cabana');

  try {
    await mkdir(dir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(dir, filename), Buffer.from(bytes));

    const photos = await getCabanaGallery();
    const maxOrder = photos.reduce((m, p) => Math.max(m, p.order), 0);
    const newPhoto: CabanaPhoto = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      src: `/images/cabana/${filename}`,
      caption: '',
      order: maxOrder + 1,
    };
    await saveCabanaGallery([...photos, newPhoto]);
    revalidatePath('/cabana');
    return { photo: newPhoto };
  } catch (e) {
    return { error: `Eroare la salvare: ${String(e)}` };
  }
}

export async function deleteCabanaPhoto(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const photos = await getCabanaGallery();
    const photo = photos.find((p) => p.id === id);
    if (!photo) return { success: false, error: 'Fotografia nu există.' };

    const filePath = path.join(process.cwd(), 'public', photo.src);
    try {
      await unlink(filePath);
    } catch {
      // File already gone — not a fatal error
    }

    const updated = photos
      .filter((p) => p.id !== id)
      .map((p, i) => ({ ...p, order: i + 1 }));
    await saveCabanaGallery(updated);
    revalidatePath('/cabana');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function reorderCabanaPhotos(
  reordered: { id: string; order: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getCabanaGallery();
    const orderMap = new Map(reordered.map((p) => [p.id, p.order]));
    const updated = current
      .map((p) => ({ ...p, order: orderMap.get(p.id) ?? p.order }))
      .sort((a, b) => a.order - b.order);
    await saveCabanaGallery(updated);
    revalidatePath('/cabana');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ── River's Land gallery ──────────────────────────────────────────────────────

const MAX_RL_PHOTOS = 8;

export async function uploadRiversLandPhoto(
  formData: FormData
): Promise<{ photo: RiversLandPhoto } | { error: string }> {
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Niciun fișier selectat.' };

  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
  if (!ALLOWED.includes(file.type)) return { error: 'Tip nepermis. Folosiți JPG, PNG sau WebP.' };
  if (file.size > 10 * 1024 * 1024) return { error: 'Fișierul este prea mare (max 10 MB).' };

  const photos = await getRiversLandGallery();
  if (photos.length >= MAX_RL_PHOTOS) {
    return { error: `Limita de ${MAX_RL_PHOTOS} fotografii a fost atinsă. Șterge una înainte de a încărca alta.` };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `rl-${Date.now()}-${Math.random().toString(36).slice(2, 5)}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'images', 'rivers-land');

  try {
    await mkdir(dir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(dir, filename), Buffer.from(bytes));

    const maxOrder = photos.reduce((m, p) => Math.max(m, p.order), 0);
    const newPhoto: RiversLandPhoto = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      src: `/images/rivers-land/${filename}`,
      caption: '',
      order: maxOrder + 1,
    };
    await saveRiversLandGallery([...photos, newPhoto]);
    revalidatePath('/rivers-land');
    return { photo: newPhoto };
  } catch (e) {
    return { error: `Eroare la salvare: ${String(e)}` };
  }
}

export async function deleteRiversLandPhoto(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const photos = await getRiversLandGallery();
    const photo = photos.find((p) => p.id === id);
    if (!photo) return { success: false, error: 'Fotografia nu există.' };

    const filePath = path.join(process.cwd(), 'public', photo.src);
    try {
      await unlink(filePath);
    } catch {
      // File already gone — not fatal
    }

    const updated = photos
      .filter((p) => p.id !== id)
      .map((p, i) => ({ ...p, order: i + 1 }));
    await saveRiversLandGallery(updated);
    revalidatePath('/rivers-land');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function reorderRiversLandPhotos(
  reordered: { id: string; order: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getRiversLandGallery();
    const orderMap = new Map(reordered.map((p) => [p.id, p.order]));
    const updated = current
      .map((p) => ({ ...p, order: orderMap.get(p.id) ?? p.order }))
      .sort((a, b) => a.order - b.order);
    await saveRiversLandGallery(updated);
    revalidatePath('/rivers-land');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ── River's Marina gallery ────────────────────────────────────────────────────

const MAX_RM_PHOTOS = 8;

export async function uploadRiversMarinaPhoto(
  formData: FormData
): Promise<{ photo: RiversMarinaPhoto } | { error: string }> {
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Niciun fișier selectat.' };

  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
  if (!ALLOWED.includes(file.type)) return { error: 'Tip nepermis. Folosiți JPG, PNG sau WebP.' };
  if (file.size > 10 * 1024 * 1024) return { error: 'Fișierul este prea mare (max 10 MB).' };

  const photos = await getRiversMarinaGallery();
  if (photos.length >= MAX_RM_PHOTOS) {
    return { error: `Limita de ${MAX_RM_PHOTOS} fotografii a fost atinsă. Șterge una înainte de a încărca alta.` };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `rm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'images', 'rivers-marina');

  try {
    await mkdir(dir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(dir, filename), Buffer.from(bytes));

    const maxOrder = photos.reduce((m, p) => Math.max(m, p.order), 0);
    const newPhoto: RiversMarinaPhoto = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      src: `/images/rivers-marina/${filename}`,
      caption: '',
      order: maxOrder + 1,
    };
    await saveRiversMarinaGallery([...photos, newPhoto]);
    revalidatePath('/rivers-marina');
    return { photo: newPhoto };
  } catch (e) {
    return { error: `Eroare la salvare: ${String(e)}` };
  }
}

export async function deleteRiversMarinaPhoto(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const photos = await getRiversMarinaGallery();
    const photo = photos.find((p) => p.id === id);
    if (!photo) return { success: false, error: 'Fotografia nu există.' };

    const filePath = path.join(process.cwd(), 'public', photo.src);
    try {
      await unlink(filePath);
    } catch {
      // File already gone — not fatal
    }

    const updated = photos
      .filter((p) => p.id !== id)
      .map((p, i) => ({ ...p, order: i + 1 }));
    await saveRiversMarinaGallery(updated);
    revalidatePath('/rivers-marina');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function reorderRiversMarinaPhotos(
  reordered: { id: string; order: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getRiversMarinaGallery();
    const orderMap = new Map(reordered.map((p) => [p.id, p.order]));
    const updated = current
      .map((p) => ({ ...p, order: orderMap.get(p.id) ?? p.order }))
      .sort((a, b) => a.order - b.order);
    await saveRiversMarinaGallery(updated);
    revalidatePath('/rivers-marina');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
