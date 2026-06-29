import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's orders (non-cancelled)
    const todayOrders = await prisma.order.findMany({
      where: { createdAt: { gte: todayStart }, status: { not: 'anulata' } },
      select: { id: true, total: true, createdAt: true, status: true, items: true },
    });

    const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);
    const todayOrderCount = todayOrders.length;
    const todayAvg = todayOrderCount > 0 ? todaySales / todayOrderCount : 0;

    // New users today
    const newUsersToday = await prisma.user.count({
      where: { createdAt: { gte: todayStart }, role: 'client' },
    });

    // Orders per hour (today, all statuses for trend)
    const allTodayOrders = await prisma.order.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { createdAt: true },
    });
    const ordersPerHour: number[] = Array(24).fill(0);
    for (const o of allTodayOrders) {
      ordersPerHour[new Date(o.createdAt).getHours()]++;
    }

    // Best sellers: last week (completed orders)
    const [weekOrders, monthOrders] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: weekStart }, status: { not: 'anulata' } },
        select: { items: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: monthStart }, status: { not: 'anulata' } },
        select: { items: true },
      }),
    ]);

    function extractBestsellers(orders: { items: unknown }[], limit = 10) {
      const counts: Record<string, { name: string; count: number; revenue: number }> = {};
      for (const o of orders) {
        const items = o.items as Array<{ name?: string; productId?: string; quantity?: number; price?: number }>;
        if (!Array.isArray(items)) continue;
        for (const item of items) {
          const key = item.productId ?? item.name ?? 'unknown';
          const qty = item.quantity ?? 1;
          const price = item.price ?? 0;
          if (!counts[key]) counts[key] = { name: item.name ?? key, count: 0, revenue: 0 };
          counts[key].count += qty;
          counts[key].revenue += qty * price;
        }
      }
      return Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    }

    const bestsellersToday = extractBestsellers(todayOrders);
    const bestsellersWeek = extractBestsellers(weekOrders);
    const bestsellersMonth = extractBestsellers(monthOrders);

    // Peak heatmap: last 7 days by [dayOfWeek][hour]
    const heatmapOrders = await prisma.order.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { createdAt: true },
    });
    // heatmap[day 0-6][hour 0-23] = count
    const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const o of heatmapOrders) {
      const d = new Date(o.createdAt);
      const dow = d.getDay(); // 0=Sun
      const hr = d.getHours();
      heatmap[dow][hr]++;
    }

    return NextResponse.json({
      todaySales,
      todayOrderCount,
      todayAvg,
      newUsersToday,
      ordersPerHour,
      bestsellersToday,
      bestsellersWeek,
      bestsellersMonth,
      heatmap,
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
