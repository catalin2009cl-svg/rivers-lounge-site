import { getSpecialEvents } from '@/lib/server-data';
import { EventsAdminClient } from '@/components/admin/events-admin-client';
import { getSession } from '@/lib/auth';

export const metadata = { title: "Admin Evenimente | River's Lounge" };

export default async function AdminEventsPage() {
  const [events, session] = await Promise.all([getSpecialEvents(), getSession()]);
  return <EventsAdminClient initialEvents={events} role={session?.role ?? 'admin'} />;
}
