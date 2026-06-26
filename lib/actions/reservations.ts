'use server';

import { cookies } from 'next/headers';
import { getReservations, saveReservations, getUserByEmail, getUsers, saveUsers } from '@/lib/server-data';
import type { Reservation, ReservationNotification } from '@/lib/server-data';
import { getSession } from '@/lib/auth';
import { logOperatorActivity } from '@/lib/actions/operators';

export interface ReservationInput {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  location: string;
  eventType: string;
  notes: string;
}

export async function saveReservation(
  input: ReservationInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const reservations = await getReservations();
    const now = new Date().toISOString();
    const newReservation: Reservation = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now,
      status: 'noua',
      observation: '',
      name: input.name,
      phone: input.phone,
      email: input.email,
      date: input.date,
      time: input.time,
      guests: input.guests,
      location: input.location,
      eventType: input.eventType,
      notes: input.notes,
    };
    await saveReservations([...reservations, newReservation]);

    // Track user activity for GDPR retention
    try {
      const users = await getUsers();
      const uIdx = users.findIndex((u) => u.email.toLowerCase() === input.email.toLowerCase());
      if (uIdx !== -1) {
        users[uIdx] = { ...users[uIdx], lastActivityAt: now };
        await saveUsers(users);
      }
    } catch { /* non-critical */ }

    return { success: true, id: newReservation.id };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

function buildNotificationMessage(
  status: Reservation['status'],
  reservation: Reservation,
  adminNote?: string
): string {
  const d = new Date(reservation.date + 'T00:00:00');
  const dateStr = d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' });
  const timeStr = reservation.time ? `, ora ${reservation.time}` : '';
  const locStr = reservation.location ? ` la ${reservation.location}` : '';
  switch (status) {
    case 'acceptata':
      return `Rezervarea ta pentru ${dateStr}${timeStr} a fost confirmată! Te așteptăm cu drag${locStr}.`;
    case 'refuzata':
      return adminNote
        ? `Ne pare rău, rezervarea ta pentru ${dateStr}${timeStr} nu a putut fi onorată. ${adminNote}`
        : `Ne pare rău, rezervarea ta pentru ${dateStr}${timeStr} nu a putut fi onorată. Te rugăm să ne contactezi la 0734 642 449.`;
    case 'in-asteptare':
      return `Rezervarea ta pentru ${dateStr}${timeStr} este în curs de verificare. Îți vom răspunde în curând.`;
    default:
      return `Statusul rezervării tale pentru ${dateStr}${timeStr} a fost actualizat.`;
  }
}

export async function updateReservationStatus(
  id: string,
  status: Reservation['status'],
  observation: string,
  adminNote?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const reservations = await getReservations();
    const idx = reservations.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, error: 'Rezervarea nu există.' };
    const current = reservations[idx];
    const now = new Date().toISOString();
    const session = await getSession();
    const processedByEntry =
      session?.role === 'operator' && session.operatorId
        ? {
            operatorId: session.operatorId,
            operatorName: session.name,
            action: status,
            timestamp: now,
          }
        : null;

    const existingNotifications = current.notifications ?? [];
    const newNotifications: ReservationNotification[] =
      current.status !== status
        ? [
            ...existingNotifications,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              message: buildNotificationMessage(status, current, adminNote),
              oldStatus: current.status,
              newStatus: status,
              createdAt: now,
              isRead: false,
              ...(adminNote ? { adminNote } : {}),
            },
          ]
        : existingNotifications;

    reservations[idx] = {
      ...current,
      status,
      observation,
      updatedAt: now,
      notifications: newNotifications,
      processedBy: processedByEntry
        ? [...(current.processedBy ?? []), processedByEntry]
        : current.processedBy,
    };
    await saveReservations(reservations);
    if (session?.role === 'operator' && session.operatorId) {
      await logOperatorActivity(session.operatorId, {
        action: status,
        targetId: id,
        targetType: 'reservation',
        details: `Rezervare ${id} → ${status}`,
      });
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function markReservationNotificationsRead(
  reservationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const reservations = await getReservations();
    const idx = reservations.findIndex((r) => r.id === reservationId);
    if (idx === -1) return { success: false, error: 'Rezervarea nu există.' };
    reservations[idx] = {
      ...reservations[idx],
      notifications: (reservations[idx].notifications ?? []).map((n) =>
        n.isRead ? n : { ...n, isRead: true }
      ),
    };
    await saveReservations(reservations);
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\.+]/g, '');
}

export async function getMyReservations(): Promise<Reservation[]> {
  const cookieStore = await cookies();
  const email = cookieStore.get('user_email')?.value;
  if (!email) return [];
  const [user, reservations] = await Promise.all([
    getUserByEmail(email),
    getReservations(),
  ]);
  const normEmail = email.toLowerCase();
  const normUserPhone = user?.phone ? normalizePhone(user.phone) : null;
  return reservations.filter(
    (r) =>
      r.email.toLowerCase() === normEmail ||
      (normUserPhone && normalizePhone(r.phone) === normUserPhone)
  );
}

export async function deleteReservation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const reservations = await getReservations();
    const updated = reservations.filter((r) => r.id !== id);
    if (updated.length === reservations.length) {
      return { success: false, error: 'Rezervarea nu există.' };
    }
    await saveReservations(updated);
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
