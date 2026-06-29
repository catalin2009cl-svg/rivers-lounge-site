import { getSession } from '@/lib/auth';
import { getAllCabinPackages } from '@/lib/server-data';
import { CabanaAdminClient } from './CabanaAdminClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: "Admin Cabana | River's Lounge" };

export default async function AdminCabanaPage() {
  const [session, packages] = await Promise.all([getSession(), getAllCabinPackages()]);
  return <CabanaAdminClient initialPackages={packages} role={session?.role ?? 'admin'} />;
}
