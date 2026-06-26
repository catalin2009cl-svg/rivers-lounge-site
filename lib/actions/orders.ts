'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getOrders, saveOrders, getUsers, saveUsers } from '@/lib/server-data';
import type { Order, OrderItem, User } from '@/lib/server-data';
import { getSession } from '@/lib/auth';
import { logOperatorActivity } from '@/lib/actions/operators';

export interface OrderInput {
  name: string;
  phone: string;
  address: string;
  city: string;
  addressDetails: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'cash' | 'card';
  orderType: 'livrare' | 'ridicare';
  notes: string;
  userLat?: number;
  userLng?: number;
  userId?: string;
  userEmail?: string;
}

export async function saveOrder(
  input: OrderInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const orders = await getOrders();
    const now = new Date().toISOString();
    const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
    const id = `ORD-${Date.now()}-${suffix}`;

    const newOrder: Order = {
      id,
      createdAt: now,
      updatedAt: now,
      name: input.name,
      phone: input.phone,
      address: input.address,
      city: input.city,
      addressDetails: input.addressDetails,
      items: input.items,
      subtotal: input.subtotal,
      deliveryFee: input.deliveryFee,
      total: input.total,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'pending',
      orderType: input.orderType,
      status: 'noua',
      observation: '',
      notes: input.notes,
      ...(input.userLat !== undefined ? { userLat: input.userLat } : {}),
      ...(input.userLng !== undefined ? { userLng: input.userLng } : {}),
      ...(input.userId !== undefined ? { userId: input.userId } : {}),
      ...(input.userEmail !== undefined ? { userEmail: input.userEmail } : {}),
    };

    await saveOrders([newOrder, ...orders]);

    if (input.userId) {
      const users = await getUsers();
      const uIdx = users.findIndex((u) => u.id === input.userId);
      if (uIdx !== -1) {
        users[uIdx] = { ...users[uIdx], lastOrderAt: now, lastActivityAt: now };
        await saveUsers(users);
      }
    }

    revalidatePath('/admin/comenzi');
    return { success: true, id };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateOrderStatus(
  id: string,
  status: Order['status'],
  observation?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const orders = await getOrders();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return { success: false, error: 'Comanda nu există.' };
    const previousStatus = orders[idx].status;
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
    orders[idx] = {
      ...orders[idx],
      status,
      ...(observation !== undefined ? { observation } : {}),
      updatedAt: now,
      processedBy: processedByEntry
        ? [...(orders[idx].processedBy ?? []), processedByEntry]
        : orders[idx].processedBy,
    };
    await saveOrders(orders);

    // Update user stats when transitioning TO 'livrata' for the first time
    const order = orders[idx];
    if (status === 'livrata' && previousStatus !== 'livrata' && order.userEmail) {
      const users = await getUsers();
      const uIdx = users.findIndex((u) => u.email.toLowerCase() === order.userEmail!.toLowerCase());
      if (uIdx !== -1) {
        const newTotal = (users[uIdx].totalOrders ?? 0) + 1;
        const newSpent = (users[uIdx].totalSpent ?? 0) + order.total;
        users[uIdx] = { ...users[uIdx], totalOrders: newTotal, totalSpent: newSpent, lastOrderAt: now };
        await saveUsers(users);
      }
    }

    if (session?.role === 'operator' && session.operatorId) {
      await logOperatorActivity(session.operatorId, {
        action: status,
        targetId: id,
        targetType: 'order',
        details: `Comandă ${id} → ${status}`,
      });
    }
    revalidatePath('/admin/comenzi');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updatePaymentStatus(
  id: string,
  paymentStatus: Order['paymentStatus']
): Promise<{ success: boolean; error?: string }> {
  try {
    const orders = await getOrders();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return { success: false, error: 'Comanda nu există.' };
    orders[idx] = { ...orders[idx], paymentStatus, updatedAt: new Date().toISOString() };
    await saveOrders(orders);
    revalidatePath('/admin/comenzi');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const orders = await getOrders();
  const normalized = email.toLowerCase();
  return orders.filter((o) => o.userEmail?.toLowerCase() === normalized);
}

export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  const orders = await getOrders();
  return orders.filter((o) => o.userId === userId);
}

export async function getMyOrders(): Promise<Order[]> {
  const cookieStore = await cookies();
  const email = cookieStore.get('user_email')?.value;
  if (!email) return [];
  return getOrdersByEmail(email);
}

export async function deleteOrder(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const orders = await getOrders();
    const updated = orders.filter((o) => o.id !== id);
    if (updated.length === orders.length) return { success: false, error: 'Comanda nu există.' };
    await saveOrders(updated);
    revalidatePath('/admin/comenzi');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getSavedAddressesForUser(
  email: string
): Promise<{ address: string; city: string; count: number }[]> {
  const orders = await getOrders();
  const normalized = email.toLowerCase();
  const counts = new Map<string, { address: string; city: string; count: number }>();
  for (const order of orders) {
    if (order.userEmail?.toLowerCase() !== normalized) continue;
    if (!order.address || order.orderType !== 'livrare') continue;
    const key = `${order.address}|||${order.city}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count++;
    } else {
      counts.set(key, { address: order.address, city: order.city ?? 'Călărași', count: 1 });
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}


export async function fetchOrdersForPolling(): Promise<Order[]> {
  try {
    return await getOrders();
  } catch {
    return [];
  }
}


export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const orders = await getOrders();
    return orders.find((o) => o.id === id) ?? null;
  } catch {
    return null;
  }
}

