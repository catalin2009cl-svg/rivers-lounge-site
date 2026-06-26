import { getReviews } from '@/lib/server-data';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { ReviewsAdminClient } from '@/components/admin/reviews-admin-client';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Recenzii — Admin Rivers Lounge' };

export default async function RecenziiPage() {
  const session = await getSession();
  if (!session || !hasPermission(session.role, 'recenzii.view')) {
    redirect('/admin');
  }

  const reviews = await getReviews();
  const canDelete = hasPermission(session.role, 'recenzii.delete');

  return <ReviewsAdminClient initialReviews={reviews} canDelete={canDelete} />;
}
