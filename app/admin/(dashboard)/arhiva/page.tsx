import { getOrders } from '@/lib/server-data';
import { ArchiveAdminClient } from '@/components/admin/archive-admin-client';
import { OrdersSubNav } from '@/components/admin/orders-sub-nav';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Arhivă Comenzi | Admin River's Lounge",
};

export default async function ArchivePage() {
  const orders = await getOrders();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#F0EDE6]">Comenzi</h1>
        <p className="text-sm text-[#9A9490] mt-1">
          <span className="text-[#C9A84C]">Arhivă & Istoric</span> — toate comenzile plasate vreodată, cu căutare și filtrare avansată.
        </p>
      </div>
      <OrdersSubNav />
      <ArchiveAdminClient initialOrders={orders} />
    </div>
  );
}
