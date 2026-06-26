'use server';

import { revalidatePath } from 'next/cache';
import { getNewsPosts, saveNewsPosts, type NewsPost } from '@/lib/server-data';

type ActionResult<T = void> = T extends void
  ? { success: boolean; error?: string }
  : { success: boolean; data?: T; error?: string };

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export async function createNewsPost(
  post: Omit<NewsPost, 'id' | 'slug'>
): Promise<ActionResult<NewsPost>> {
  try {
    const posts = await getNewsPosts();
    const newPost: NewsPost = {
      ...post,
      id: generateId(),
      slug: generateSlug(post.title),
    };
    await saveNewsPosts([newPost, ...posts]);
    revalidatePath('/');
    revalidatePath('/noutati');
    revalidatePath('/admin/noutati');
    return { success: true, data: newPost };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateNewsPost(
  id: string,
  updates: Partial<Omit<NewsPost, 'id'>>
): Promise<ActionResult<NewsPost>> {
  try {
    const posts = await getNewsPosts();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, error: 'Articolul nu a fost găsit.' };
    const updated: NewsPost = {
      ...posts[idx],
      ...updates,
      slug: updates.title ? generateSlug(updates.title) : posts[idx].slug,
    };
    posts[idx] = updated;
    await saveNewsPosts(posts);
    revalidatePath('/');
    revalidatePath('/noutati');
    revalidatePath(`/noutati/${id}`);
    revalidatePath('/admin/noutati');
    return { success: true, data: updated };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteNewsPost(id: string): Promise<ActionResult> {
  try {
    const posts = await getNewsPosts();
    await saveNewsPosts(posts.filter((p) => p.id !== id));
    revalidatePath('/');
    revalidatePath('/noutati');
    revalidatePath('/admin/noutati');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
