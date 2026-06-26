import { getSettings, listUploadedImages } from '@/lib/server-data';
import { SettingsAdminClient } from '@/components/admin/settings-admin-client';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Setări Site | Admin' };

export default async function SetariPage() {
  const [settings, mediaImages] = await Promise.all([getSettings(), listUploadedImages()]);
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Setări Site</h1>
        <p className="text-sm text-gray-400 mt-1">Imaginea hero, program și informații de contact</p>
      </div>
      <SettingsAdminClient initialSettings={settings} mediaImages={mediaImages} />
    </div>
  );
}
