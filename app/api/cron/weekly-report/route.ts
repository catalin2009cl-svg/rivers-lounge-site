import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateWeeklyPDF } from '@/lib/reports/generateWeeklyPDF';
import { sendWeeklyReportEmail } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';

const DAY_NAMES_RO = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
const DAY_NAMES_SHORT = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const fmt = (d: Date) => d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
    const weekLabel = `${fmt(weekStart)} – ${fmt(weekEnd)}`;

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: weekStart, lt: weekEnd } },
      select: {
        id: true,
        status: true,
        total: true,
        items: true,
        createdAt: true,
      },
    });

    const nonCancelled = orders.filter((o) => o.status !== 'anulata');
    const completed = orders.filter((o) => o.status === 'livrata');
    const cancelled = orders.filter((o) => o.status === 'anulata');
    const totalRevenue = nonCancelled.reduce((s, o) => s + o.total, 0);
    const avgOrderValue = nonCancelled.length ? totalRevenue / nonCancelled.length : 0;

    const newCustomers = await prisma.user.count({
      where: { createdAt: { gte: weekStart, lt: weekEnd }, role: 'client' },
    });

    // Revenue by day
    const revenueByDayMap: Record<number, { revenue: number; orders: number }> = {};
    for (let i = 0; i < 7; i++) revenueByDayMap[i] = { revenue: 0, orders: 0 };
    for (const o of nonCancelled) {
      const dow = new Date(o.createdAt).getDay();
      revenueByDayMap[dow].revenue += o.total;
      revenueByDayMap[dow].orders++;
    }
    const revenueByDay = Array.from({ length: 7 }, (_, i) => ({
      day: DAY_NAMES_SHORT[i],
      revenue: revenueByDayMap[i].revenue,
      orders: revenueByDayMap[i].orders,
    }));

    // Peak day
    const peakDowEntry = Object.entries(revenueByDayMap).sort(([, a], [, b]) => b.orders - a.orders)[0];
    const peakDay = DAY_NAMES_RO[Number(peakDowEntry[0])];

    // Peak hour
    const hourCounts: Record<number, number> = {};
    for (const o of orders) {
      const hr = new Date(o.createdAt).getHours();
      hourCounts[hr] = (hourCounts[hr] ?? 0) + 1;
    }
    const peakHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '12';

    // Top products
    const productMap: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const o of nonCancelled) {
      const items = o.items as Array<{ name?: string; productId?: string; quantity?: number; price?: number }>;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const key = item.productId ?? item.name ?? 'unknown';
        const qty = item.quantity ?? 1;
        const price = item.price ?? 0;
        if (!productMap[key]) productMap[key] = { name: item.name ?? key, count: 0, revenue: 0 };
        productMap[key].count += qty;
        productMap[key].revenue += qty * price;
      }
    }
    const topProducts = Object.values(productMap).sort((a, b) => b.count - a.count).slice(0, 10);

    const pdfData = {
      weekLabel,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalRevenue,
      totalOrders: orders.length,
      completedOrders: completed.length,
      cancelledOrders: cancelled.length,
      newCustomers,
      avgOrderValue,
      topProducts,
      peakDay,
      peakHour: Number(peakHour),
      revenueByDay,
    };

    const pdfBuffer = await generateWeeklyPDF(pdfData);

    // Save report to DB
    const report = await prisma.weeklyReport.create({
      data: {
        weekStart,
        weekEnd,
        totalRevenue,
        totalOrders: orders.length,
        completedOrders: completed.length,
        cancelledOrders: cancelled.length,
        newCustomers,
        avgOrderValue,
        topProducts,
        peakDay,
        peakHour: Number(peakHour),
        revenueByDay,
      },
    });

    await sendWeeklyReportEmail(pdfBuffer, weekLabel);

    await prisma.weeklyReport.update({
      where: { id: report.id },
      data: { emailSentAt: new Date() },
    });

    return NextResponse.json({ ok: true, reportId: report.id });
  } catch (err) {
    console.error('[weekly-report]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
