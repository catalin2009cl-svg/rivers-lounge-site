'use server';

import { revalidatePath } from 'next/cache';
import { hashPassword } from '@/lib/utils/hash';
import {
  getOperators,
  saveOperators,
  type Operator,
  type OperatorActivityLog,
} from '@/lib/server-data';

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateId(): string {
  return `OPR-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function createOperator(data: {
  name: string;
  username: string;
  password: string;
  pin?: string;
  isActive: boolean;
  role?: 'manager' | 'operator';
}): Promise<{ success: boolean; operatorId?: string; error?: string }> {
  try {
    const operators = await getOperators();
    if (operators.some((op) => op.username.toLowerCase() === data.username.toLowerCase())) {
      return { success: false, error: 'Username-ul există deja.' };
    }
    const now = new Date().toISOString();
    const id = generateId();
    const newOp: Operator = {
      id,
      createdAt: now,
      name: data.name,
      username: data.username.toLowerCase(),
      passwordHash: hashPassword(data.password),
      ...(data.pin ? { pin: data.pin } : {}),
      role: data.role ?? 'operator',
      isActive: data.isActive,
      totalOrdersProcessed: 0,
      totalReservationsProcessed: 0,
      lastLoginAt: '',
      lastActivityAt: '',
      loginHistory: [],
      activityLog: [],
    };
    await saveOperators([...operators, newOp]);
    revalidatePath('/admin/utilizatori');
    return { success: true, operatorId: id };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateOperator(
  id: string,
  data: Partial<Pick<Operator, 'name' | 'username' | 'pin' | 'isActive' | 'role'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const operators = await getOperators();
    const idx = operators.findIndex((op) => op.id === id);
    if (idx === -1) return { success: false, error: 'Operatorul nu există.' };
    if (data.username && data.username !== operators[idx].username) {
      if (operators.some((op) => op.id !== id && op.username.toLowerCase() === data.username!.toLowerCase())) {
        return { success: false, error: 'Username-ul există deja.' };
      }
    }
    operators[idx] = { ...operators[idx], ...data };
    await saveOperators(operators);
    revalidatePath('/admin/utilizatori');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function resetOperatorPassword(
  id: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const operators = await getOperators();
    const idx = operators.findIndex((op) => op.id === id);
    if (idx === -1) return { success: false, error: 'Operatorul nu există.' };
    operators[idx].passwordHash = hashPassword(newPassword);
    await saveOperators(operators);
    revalidatePath('/admin/utilizatori');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function toggleOperatorActive(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateOperator(id, { isActive });
}

export async function deleteOperator(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const operators = await getOperators();
    const updated = operators.filter((op) => op.id !== id);
    if (updated.length === operators.length) return { success: false, error: 'Operatorul nu există.' };
    await saveOperators(updated);
    revalidatePath('/admin/utilizatori');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function logOperatorActivity(
  operatorId: string,
  activity: Omit<OperatorActivityLog, 'timestamp'>
): Promise<void> {
  try {
    const operators = await getOperators();
    const idx = operators.findIndex((op) => op.id === operatorId);
    if (idx === -1) return;
    const now = new Date().toISOString();
    operators[idx].lastActivityAt = now;
    if (activity.targetType === 'order') {
      operators[idx].totalOrdersProcessed = (operators[idx].totalOrdersProcessed ?? 0) + 1;
    } else {
      operators[idx].totalReservationsProcessed = (operators[idx].totalReservationsProcessed ?? 0) + 1;
    }
    operators[idx].activityLog = [
      { ...activity, timestamp: now },
      ...(operators[idx].activityLog ?? []).slice(0, 99),
    ];
    await saveOperators(operators);
  } catch {
    // Silently fail — don't block the main action
  }
}
