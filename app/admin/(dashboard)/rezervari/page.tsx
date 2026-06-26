import { getReservations } from '@/lib/server-data';
import { ReservationsAdminClient } from '@/components/admin/reservations-admin-client';
import { getSession } from '@/lib/auth';
import { CalendarCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = { title: "Rezervări | Admin River's Lounge" };

export default async function AdminRezervaPage() {
  const [reservations, session] = await Promise.all([getReservations(), getSession()]);

  return (
    <div className="p-6 lg:p-8 lg:pt-8 pt-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <CalendarCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Istoric Rezervări</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Uz intern — gestionare solicitări primite prin site
          </p>
        </div>
      </div>

      <ReservationsAdminClient
        initialReservations={reservations}
        role={session?.role ?? 'admin'}
      />
    </div>
  );
}
