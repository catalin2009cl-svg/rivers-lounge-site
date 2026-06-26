import { getOrders, getUsers } from '@/lib/server-data';
import { OrdersAdminClient } from '@/components/admin/orders-admin-client';
import { OrdersSubNav } from '@/components/admin/orders-sub-nav';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Comenzi | Admin River's Lounge",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const userId = typeof params?.userId === 'string' ? params.userId : undefined;

  const [orders, users, session] = await Promise.all([
    getOrders(),
    userId ? getUsers() : Promise.resolve([]),
    getSession(),
  ]);
  const filterUserName = userId ? users.find((u) => u.id === userId)?.name : undefined;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#F0EDE6]">Comenzi</h1>
        <p className="text-sm text-[#9A9490] mt-1">
          Gestionează comenzile active și accesează arhiva istoricului.
        </p>
      </div>
      <OrdersSubNav />
      <OrdersAdminClient
        initialOrders={orders}
        filterUserId={userId}
        filterUserName={filterUserName}
        role={session?.role ?? 'admin'}
      />
    </div>
  );
}
