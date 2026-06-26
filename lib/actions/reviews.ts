'use server';

import { getReviews, saveReviews } from '@/lib/server-data';
import { revalidatePath } from 'next/cache';
import type { Review } from '@/lib/server-data';

export async function getAllReviews(): Promise<Review[]> {
  return getReviews();
}

export async function addReview(
  input: Omit<Review, 'id'>
): Promise<{ success: boolean; review?: Review; error?: string }> {
  try {
    const reviews = await getReviews();
    const id = Date.now().toString();
    const review: Review = { id, ...input };
    await saveReviews([...reviews, review]);
    revalidatePath('/');
    return { success: true, review };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateReview(
  id: string,
  updates: Partial<Omit<Review, 'id'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const reviews = await getReviews();
    const idx = reviews.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, error: 'Recenzia nu a fost găsită.' };
    reviews[idx] = { ...reviews[idx], ...updates };
    await saveReviews(reviews);
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteReview(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const reviews = await getReviews();
    await saveReviews(reviews.filter((r) => r.id !== id));
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
