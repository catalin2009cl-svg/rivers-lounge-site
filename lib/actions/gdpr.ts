'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import {
  getUsers,
  saveUsers,
  getOrders,
  saveOrders,
  getReservations,
  saveReservations,
} from '@/lib/server-data';

const DATA_DIR = path.join(process.cwd(), 'lib', 'data');
const REQUESTS_FILE = path.join(DATA_DIR, 'gdpr-requests.json');

export type GdprRequestType = 'delete' | 'access' | 'portability' | 'rectification' | 'objection';
export type GdprRequestStatus = 'pending' | 'completed' | 'rejected';

export interface GdprRequest {
  id: string;
  receivedAt: string;
  deadline: string;
  requesterEmail: string;
  requesterName: string;
  type: GdprRequestType;
  status: GdprRequestStatus;
  notes: string;
  processedAt?: string;
  relatedUserId?: string;
}

async function readRequests(): Promise<GdprRequest[]> {
  try {
    const raw = await fs.readFile(REQUESTS_FILE, 'utf-8');
    const data = JSON.parse(raw) as { requests: GdprRequest[] };
    return data.requests ?? [];
  } catch {
    return [];
  }
}

async function writeRequests(requests: GdprRequest[]): Promise<void> {
  await fs.writeFile(REQUESTS_FILE, JSON.stringify({ requests }, null, 2), 'utf-8');
}

export async function getGdprRequests(): Promise<GdprRequest[]> {
  const requests = await readRequests();
  return requests.sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  );
}

export async function addGdprRequest(input: {
  requesterEmail: string;
  requesterName: string;
  type: GdprRequestType;
  notes: string;
  relatedUserId?: string;
}): Promise<{ success: boolean; request?: GdprRequest; error?: string }> {
  try {
    const requests = await readRequests();
    const now = new Date();
    const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const request: GdprRequest = {
      id: `GDPR-${Date.now()}-${suffix}`,
      receivedAt: now.toISOString(),
      deadline,
      requesterEmail: input.requesterEmail,
      requesterName: input.requesterName,
      type: input.type,
      status: 'pending',
      notes: input.notes,
      relatedUserId: input.relatedUserId,
    };
    requests.push(request);
    await writeRequests(requests);
    revalidatePath('/admin/gdpr');
    return { success: true, request };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateGdprRequestStatus(
  id: string,
  status: GdprRequestStatus,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const requests = await readRequests();
    const idx = requests.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, error: 'Cererea nu există.' };
    requests[idx] = {
      ...requests[idx],
      status,
      processedAt: new Date().toISOString(),
      ...(notes !== undefined ? { notes } : {}),
    };
    await writeRequests(requests);
    revalidatePath('/admin/gdpr');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function processGdprDelete(
  userId: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const norm = userEmail.toLowerCase();

    // Anonymize orders
    const orders = await getOrders();
    let ordersDirty = false;
    const updatedOrders = orders.map((o) => {
      if ((o.userEmail ?? '').toLowerCase() !== norm) return o;
      ordersDirty = true;
      return {
        ...o,
        name: 'Utilizator șters',
        phone: '***',
        address: '***',
        userEmail: 'deleted@riverslounge.ro',
        userId: undefined,
      };
    });
    if (ordersDirty) await saveOrders(updatedOrders);

    // Anonymize reservations
    const reservations = await getReservations();
    let resDirty = false;
    const updatedReservations = reservations.map((r) => {
      if (r.email.toLowerCase() !== norm) return r;
      resDirty = true;
      return { ...r, name: 'Utilizator șters', email: 'deleted@riverslounge.ro', phone: '***' };
    });
    if (resDirty) await saveReservations(updatedReservations);

    // Delete user
    const users = await getUsers();
    const filtered = users.filter((u) => u.id !== userId);
    if (filtered.length < users.length) await saveUsers(filtered);

    // Log completed GDPR delete request
    const requests = await readRequests();
    const now = new Date().toISOString();
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    requests.push({
      id: `GDPR-${Date.now()}-${suffix}`,
      receivedAt: now,
      deadline: now,
      requesterEmail: userEmail,
      requesterName: 'Procesare admin',
      type: 'delete',
      status: 'completed',
      processedAt: now,
      notes: `Cont și date personale șterse de administrator. Comenzile și rezervările au fost anonimizate (retenție fiscală 5 ani).`,
      relatedUserId: userId,
    });
    await writeRequests(requests);

    revalidatePath('/admin/gdpr');
    revalidatePath('/admin/utilizatori');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
