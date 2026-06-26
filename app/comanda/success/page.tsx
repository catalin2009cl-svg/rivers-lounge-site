import { Suspense } from 'react';
import { SiteLayout } from '@/components/layout/site-layout';
import { SuccessClient } from '@/components/checkout/success-client';
import { getCurrentUser } from '@/lib/actions/auth-user';
import { getOrderById } from '@/lib/actions/orders';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Comandă Plasată | River's Lounge",
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const [currentUser, order] = await Promise.all([
    getCurrentUser(),
    params.id ? getOrderById(params.id) : Promise.resolve(null),
  ]);

  return (
    <SiteLayout>
      <div className="pt-16">
        <Suspense fallback={<div className="min-h-[80vh]" />}>
          <SuccessClient
            isLoggedIn={!!currentUser}
            order={order}
          />
        </Suspense>
      </div>
    </SiteLayout>
  );
}
