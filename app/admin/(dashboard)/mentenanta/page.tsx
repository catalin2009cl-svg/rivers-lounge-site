import { getSettings } from '@/lib/server-data';
import { MaintenanceAdminClient } from './client';

export const dynamic = 'force-dynamic';

export const metadata = { title: "Mod Mentenanță | Admin | River's Lounge" };

export default async function MaintenanceAdminPage() {
  const settings = await getSettings();
  const mode = settings.maintenanceMode;

  return (
    <div className="p-6 lg:p-8 lg:pt-8 pt-20 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          Mod Mentenanță
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Când este activ, vizitatorii sunt redirecționați către o pagină de mentenanță animată.
        </p>
      </div>

      <MaintenanceAdminClient
        initialEnabled={mode?.enabled ?? false}
        initialTitle={mode?.title ?? 'Revenim în curând'}
        initialMessage={
          mode?.message ?? 'Lucrăm la ceva deosebit pentru voi. Ne întoarcem în curând!'
        }
      />
    </div>
  );
}
