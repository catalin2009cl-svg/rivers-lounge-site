import type { Order } from '@/lib/server-data';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RevenueSummary {
  total: number;
  cash: number;
  card: number;
  count: number;
}

export interface PeriodRow {
  key: string;
  label: string;
  count: number;
  cash: number;
  card: number;
  total: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
  percentage: number;
  category?: string;
}

export interface TopProductOptions {
  statusFilter?: string[];
  orderType?: 'all' | 'livrare' | 'ridicare';
  categoryFilter?: string;
  searchTerm?: string;
  limit?: number;
}

// ── Formatting ────────────────────────────────────────────────────────────────

export function fmtRON(n: number): string {
  return new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export function fmtDateRO(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('ro-RO', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function fmtMonthRO(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('ro-RO', {
    month: 'long', year: 'numeric',
  });
}

// ── Core helpers ──────────────────────────────────────────────────────────────

function isActive(o: Order): boolean {
  return o.status !== 'anulata';
}

export function calcRevenue(orders: Order[]): RevenueSummary {
  return orders.filter(isActive).reduce(
    (acc, o) => {
      acc.total += o.total ?? 0;
      o.paymentMethod === 'cash' ? (acc.cash += o.total ?? 0) : (acc.card += o.total ?? 0);
      acc.count++;
      return acc;
    },
    { total: 0, cash: 0, card: 0, count: 0 }
  );
}

export function filterOrdersByPeriod(orders: Order[], from: Date, to: Date): Order[] {
  const fromMs = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0).getTime();
  const toMs = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999).getTime();
  return orders.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return t >= fromMs && t <= toMs;
  });
}

export function groupByDay(orders: Order[]): Record<string, Order[]> {
  const result: Record<string, Order[]> = {};
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    (result[key] ??= []).push(o);
  });
  return result;
}

export function groupByMonth(orders: Order[]): Record<string, Order[]> {
  const result: Record<string, Order[]> = {};
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    (result[key] ??= []).push(o);
  });
  return result;
}

export function buildPeriodRows(orders: Order[], from: Date, to: Date): PeriodRow[] {
  const diffDays = Math.ceil((to.getTime() - from.getTime()) / 86_400_000);
  const useMonths = diffDays > 31;

  if (useMonths) {
    return Object.entries(groupByMonth(orders))
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, group]) => {
        const rev = calcRevenue(group);
        return { key, label: fmtMonthRO(key), count: rev.count, cash: rev.cash, card: rev.card, total: rev.total };
      });
  }

  return Object.entries(groupByDay(orders))
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, group]) => {
      const rev = calcRevenue(group);
      return { key, label: fmtDateRO(key), count: rev.count, cash: rev.cash, card: rev.card, total: rev.total };
    });
}

export function getTodayOrders(orders: Order[]): Order[] {
  const now = new Date();
  return orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

export function getThisMonthOrders(orders: Order[]): Order[] {
  const now = new Date();
  return orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && isActive(o);
  });
}

export function getBestDay(orders: Order[]): { date: string; revenue: number } | null {
  const active = orders.filter(isActive);
  const byDay = groupByDay(active);
  let best: { date: string; revenue: number } | null = null;
  Object.entries(byDay).forEach(([date, group]) => {
    const rev = group.reduce((sum, o) => sum + (o.total ?? 0), 0);
    if (!best || rev > best.revenue) best = { date, revenue: rev };
  });
  return best;
}

export function getTopProducts(orders: Order[], options?: TopProductOptions): TopProduct[] {
  const {
    statusFilter,
    orderType = 'all',
    categoryFilter = '',
    searchTerm = '',
    limit = 50,
  } = options ?? {};

  let filtered = orders;
  if (statusFilter && statusFilter.length > 0) {
    filtered = orders.filter((o) => statusFilter.includes(o.status));
  } else {
    filtered = orders.filter(isActive);
  }

  if (orderType !== 'all') {
    filtered = filtered.filter((o) => o.orderType === orderType);
  }

  const lowerSearch = searchTerm.trim().toLowerCase();
  const map = new Map<string, { quantity: number; revenue: number; category?: string }>();

  filtered.forEach((o) => {
    o.items.forEach((item) => {
      if (categoryFilter && item.category !== categoryFilter) return;
      if (lowerSearch && !item.name.toLowerCase().includes(lowerSearch)) return;
      const prev = map.get(item.name) ?? { quantity: 0, revenue: 0, category: item.category };
      map.set(item.name, {
        quantity: prev.quantity + item.quantity,
        revenue: prev.revenue + item.quantity * item.price,
        category: item.category ?? prev.category,
      });
    });
  });

  const totalRevenue = [...map.values()].reduce((s, v) => s + v.revenue, 0);
  return [...map.entries()]
    .map(([name, d]) => ({
      name,
      quantity: d.quantity,
      revenue: d.revenue,
      percentage: totalRevenue > 0 ? Math.round((d.revenue / totalRevenue) * 100) : 0,
      category: d.category,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}
