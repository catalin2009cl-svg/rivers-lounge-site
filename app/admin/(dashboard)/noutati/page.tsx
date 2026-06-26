import { getNewsPosts } from '@/lib/server-data';
import { NewsAdminClient } from '@/components/admin/news-admin-client';
import { getSession } from '@/lib/auth';

export const metadata = { title: "Admin Noutăți | River's Lounge" };

export default async function AdminNewsPage() {
  const [posts, session] = await Promise.all([getNewsPosts(), getSession()]);
  return <NewsAdminClient initialPosts={posts} role={session?.role ?? 'admin'} />;
}
