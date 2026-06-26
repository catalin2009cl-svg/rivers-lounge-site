import { requireAuth } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminNotice } from '@/components/admin/admin-notice';
import { getReservations, getOrders } from '@/lib/server-data';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const [reservations, orders] = await Promise.all([getReservations(), getOrders()]);
  const newReservationsCount = reservations.filter((r) => r.status === 'noua').length;
  const newOrdersCount = orders.filter((o) => o.status === 'noua').length;

  return (
    <div className="dark min-h-screen flex">
      <AdminSidebar
        newReservationsCount={newReservationsCount}
        newOrdersCount={newOrdersCount}
        role={session.role}
        adminName={session.name}
      />
      <main className="flex-1 min-w-0 bg-[#0F0F0F]">
        <AdminNotice />
        {children}
      </main>
    </div>
  );
}
