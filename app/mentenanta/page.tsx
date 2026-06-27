import { redirect } from 'next/navigation';
import { getSettings } from '@/lib/server-data';
import { MaintenanceDisplay } from '@/components/maintenance/maintenance-page';

export const dynamic = 'force-dynamic';

export default async function MaintenancePage() {
  const settings = await getSettings();

  if (!settings.maintenanceMode?.enabled) {
    redirect('/');
  }

  const { title, message } = settings.maintenanceMode;

  return <MaintenanceDisplay title={title} message={message} />;
}
