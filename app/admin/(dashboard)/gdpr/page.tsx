import { getUsers, getOrders, getReservations } from '@/lib/server-data';
import { getGdprRequests } from '@/lib/actions/gdpr';
import { GdprAdminClient } from '@/components/admin/gdpr-admin-client';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';

export const metadata = { title: "GDPR & Date | Admin River's Lounge" };

export default async function GdprAdminPage() {
  const session = await getSession();
  if (!session || !hasPermission(session.role, 'gdpr.view')) redirect('/admin');

  const [users, allOrders, allReservations, requests] = await Promise.all([
    getUsers(),
    getOrders(),
    getReservations(),
    getGdprRequests(),
  ]);

  return (
    <div className="p-6 lg:p-8 lg:pt-8 pt-20">
      <div className="mb-8">
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          ⚖️ GDPR & Date Personale
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gestionează cererile GDPR, exportați date și procesați solicitările utilizatorilor
        </p>
      </div>

      <GdprAdminClient
        initialUsers={users}
        allOrders={allOrders}
        allReservations={allReservations}
        initialRequests={requests}
      />
    </div>
  );
}
