import { getSocialSettings } from '@/lib/server-data';
import { SocialAdminClient } from '@/components/admin/social-admin-client';

export const dynamic = 'force-dynamic';

export default async function SocialPage() {
  const settings = await getSocialSettings();
  return <SocialAdminClient initialSettings={settings} />;
}
