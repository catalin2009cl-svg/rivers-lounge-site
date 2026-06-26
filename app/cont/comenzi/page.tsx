import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/actions/auth-user';
import { getOrdersByEmail } from '@/lib/actions/orders';
import { SiteLayout } from '@/components/layout/site-layout';
import { MyOrdersClient } from '@/components/account/my-orders-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Comenzile Mele | River's Lounge",
};

export default async function MyComenziPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/cont/autentificare');

  const orders = await getOrdersByEmail(user.email);

  return (
    <SiteLayout>
      <section className="py-10">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <div className="mb-8">
            <Link
              href="/cont"
              style={{ fontSize: 13, color: '#9A9490', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}
            >
              ← Înapoi la cont
            </Link>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE6', fontFamily: 'serif' }}>
              📦 Comenzile Mele
            </h1>
            <p style={{ color: '#9A9490', fontSize: 14, marginTop: 4 }}>
              {user.name} · {user.email}
            </p>
          </div>
          <MyOrdersClient initialOrders={orders} />
        </div>
      </section>
    </SiteLayout>
  );
}
