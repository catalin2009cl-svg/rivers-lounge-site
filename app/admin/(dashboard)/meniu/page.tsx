import { getMenuItems } from '@/lib/server-data';
import { MenuAdminClient } from '@/components/admin/menu-admin-client';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = { title: "Admin Meniu | River's Lounge" };

export default async function AdminMenuPage() {
  const [items, session] = await Promise.all([getMenuItems(), getSession()]);
  return <MenuAdminClient initialItems={items} role={session?.role ?? 'admin'} />;
}
