'use server';

import { put, list, del } from '@vercel/blob';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Niciun fișier selectat.' };
  if (!ALLOWED_TYPES.includes(file.type)) return { error: 'Tip de fișier nepermis. Folosiți JPG, PNG sau WebP.' };
  if (file.size > MAX_SIZE) return { error: 'Fișierul este prea mare (max 5 MB).' };

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const pathname = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    const blob = await put(pathname, file, { access: 'public' });
    return { url: blob.url };
  } catch (e) {
    return { error: `Eroare la salvarea fișierului: ${String(e)}` };
  }
}

export async function getUploadedImages(): Promise<string[]> {
  try {
    const { blobs } = await list({ prefix: 'uploads/', limit: 1000 });
    return blobs
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .map((b) => b.url);
  } catch {
    return [];
  }
}

export async function deleteImage(
  url: string
): Promise<{ success: boolean; error?: string }> {
  if (!url) return { success: false, error: 'URL invalid.' };
  try {
    await del(url);
    return { success: true };
  } catch (e) {
    return { success: false, error: `Eroare la ștergere: ${String(e)}` };
  }
}
