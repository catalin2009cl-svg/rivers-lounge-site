'use server';

import { writeFile, mkdir, unlink, readdir } from 'fs/promises';
import path from 'path';

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
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

  try {
    await mkdir(uploadsDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadsDir, filename), Buffer.from(bytes));
    return { url: `/uploads/${filename}` };
  } catch (e) {
    return { error: `Eroare la salvarea fișierului: ${String(e)}` };
  }
}

export async function getUploadedImages(): Promise<string[]> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  try {
    const files = await readdir(uploadsDir);
    return files
      .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
      .sort((a, b) => b.localeCompare(a))
      .map((f) => `/uploads/${f}`);
  } catch {
    return [];
  }
}

export async function deleteImage(
  filename: string
): Promise<{ success: boolean; error?: string }> {
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return { success: false, error: 'Nume de fișier invalid.' };
  }
  const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
  try {
    await unlink(filePath);
    return { success: true };
  } catch (e) {
    return { success: false, error: `Eroare la ștergere: ${String(e)}` };
  }
}
