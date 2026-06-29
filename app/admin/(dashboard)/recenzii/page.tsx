import { getReviews } from '@/lib/server-data';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { ReviewsAdminClient } from '@/components/admin/reviews-admin-client';
import { prisma } from '@/lib/prisma';
import { OrderReviewsSection } from '@/components/admin/OrderReviewsSection';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Recenzii — Admin Rivers Lounge' };

export default async function RecenziiPage() {
  const session = await getSession();
  if (!session || !hasPermission(session.role, 'recenzii.view')) {
    redirect('/admin');
  }

  const [reviews, orderReviewsRaw] = await Promise.all([
    getReviews(),
    prisma.orderReview.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, total: true } },
      },
    }),
  ]);
  const canDelete = hasPermission(session.role, 'recenzii.delete');
  const orderReviews = JSON.parse(JSON.stringify(orderReviewsRaw));

  return (
    <div>
      <OrderReviewsSection reviews={orderReviews} />
      <ReviewsAdminClient initialReviews={reviews} canDelete={canDelete} />
    </div>
  );
}
