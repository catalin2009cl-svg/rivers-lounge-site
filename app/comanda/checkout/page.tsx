import { SiteLayout } from '@/components/layout/site-layout';
import { CheckoutClient } from '@/components/checkout/checkout-client';
import { getSettings } from '@/lib/server-data';
import { getCurrentUser } from '@/lib/actions/auth-user';
import { getSavedAddressesForUser } from '@/lib/actions/orders';
import { getLoyaltyProfileForUser } from '@/lib/loyalty/getLoyaltyProfile';
import { expireWalletIfNeeded } from '@/lib/loyalty/expireWallet';
import type { DeliveryConfig } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Finalizează Comanda | River's Lounge",
  description: 'Completează detaliile pentru livrare sau ridicare.',
};

const DEFAULT_DELIVERY: DeliveryConfig = {
  restaurantLat: 44.2009,
  restaurantLng: 27.331,
  maxRadiusKm: 25,
  gpsTiers: [
    { fromKm: 0, toKm: 5, fee: 0, minOrder: 50 },
    { fromKm: 5, toKm: 10, fee: 10, minOrder: 50 },
    { fromKm: 10, toKm: 25, fee: 15, minOrder: 100 },
  ],
};

export default async function CheckoutPage() {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  const deliveryConfig = settings.delivery ?? DEFAULT_DELIVERY;

  const currentUser = user
    ? { id: user.id, name: user.name, email: user.email, phone: user.phone }
    : null;

  // Expire stale wallet credits before showing checkout
  if (user) await expireWalletIfNeeded(user.id);

  const [savedAddresses, loyaltyProfile] = await Promise.all([
    user ? getSavedAddressesForUser(user.email) : Promise.resolve([]),
    user ? getLoyaltyProfileForUser(user.id) : Promise.resolve(null),
  ]);

  const activeReward = loyaltyProfile?.activeReward ?? null;
  const walletBalance = loyaltyProfile?.walletBalance ?? 0;
  const walletExpiresAt = loyaltyProfile?.walletExpiresAt ?? null;

  return (
    <SiteLayout>
      <div className="pt-20">
        <CheckoutClient
          deliveryConfig={deliveryConfig}
          currentUser={currentUser}
          savedAddresses={savedAddresses}
          activeReward={activeReward}
          walletBalance={walletBalance}
          walletExpiresAt={walletExpiresAt}
        />
      </div>
    </SiteLayout>
  );
}
