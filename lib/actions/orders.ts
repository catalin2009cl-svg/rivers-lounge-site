'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getOrders, saveOrders, getUsers, saveUsers } from '@/lib/server-data';
import type { Order, OrderItem, User } from '@/lib/server-data';
import { getSession } from '@/lib/auth';
import { logOperatorActivity } from '@/lib/actions/operators';
import { processOrderForLoyalty } from '@/lib/loyalty/processLoyalty';
import { applyRewardToOrder } from '@/lib/loyalty/applyReward';
import { prisma } from '@/lib/prisma';

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
  loyaltyRewardId?: string;
  loyaltyDiscountAmount?: number;
  walletCreditAmount?: number;
}

export async function saveOrder(
  input: OrderInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const orders = await getOrders();
    const now = new Date().toISOString();
    const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
    const id = `ORD-${Date.now()}-${suffix}`;

    // Validate loyalty reward server-side before saving order
    let finalDiscountAmount = 0;
    let discountApplied: string | undefined;
    if (input.loyaltyRewardId && input.userId && input.loyaltyDiscountAmount) {
      const rewardResult = await applyRewardToOrder({
        rewardId: input.loyaltyRewardId,
        userId: input.userId,
        orderId: id,
        orderSubtotal: input.subtotal,
        hasOtherDiscount: false,
      });
      if (rewardResult.success && rewardResult.discountAmount) {
        finalDiscountAmount = rewardResult.discountAmount;
        discountApplied = `LOYALTY:${input.loyaltyRewardId}`;
      }
    }

    // Apply wallet credit deduction
    let walletDeduction = 0;
    if (input.walletCreditAmount && input.walletCreditAmount > 0 && input.userId) {
      try {
        const profile = await prisma.loyaltyProfile.findUnique({
          where: { userId: input.userId },
          select: { id: true, walletBalance: true },
        });
        if (profile && profile.walletBalance >= 0.01) {
          const deductAmount = Math.min(
            input.walletCreditAmount,
            profile.walletBalance,
            Math.max(0, input.subtotal - finalDiscountAmount)
          );
          if (deductAmount > 0) {
            const newBalance = Math.max(0, Math.round((profile.walletBalance - deductAmount) * 100) / 100);
            await prisma.$transaction(async (tx) => {
              await tx.loyaltyProfile.update({
                where: { id: profile.id },
                data: { walletBalance: newBalance },
              });
              await tx.walletTransaction.create({
                data: {
                  loyaltyProfileId: profile.id,
                  userId: input.userId!,
                  type: 'CREDIT_USED',
                  amount: -deductAmount,
                  balanceBefore: profile.walletBalance,
                  balanceAfter: newBalance,
                  usedOnOrderId: id,
                  description: `Credit folosit pe comanda #${id.slice(-6).toUpperCase()}`,
                },
              });
            });
            walletDeduction = deductAmount;
          }
        }
      } catch {
        // Non-critical — do not break order flow
      }
    }

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
      total: Math.max(0, input.total - finalDiscountAmount - walletDeduction),
      discountAmount: (finalDiscountAmount + walletDeduction) > 0 ? finalDiscountAmount + walletDeduction : undefined,
      discountApplied: discountApplied ?? (walletDeduction > 0 ? `WALLET:${walletDeduction.toFixed(2)}` : undefined),
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

      // Process loyalty points for logged-in users
      if (order.userId) {
        try {
          await processOrderForLoyalty(order.id, order.userId, order.subtotal);
        } catch {
          // Non-critical — do not break order flow
        }
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

