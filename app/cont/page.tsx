import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { AccountDashboard } from '@/components/account/account-forms';
import { PasskeyPrompt } from '@/components/account/PasskeyPrompt';
import { getCurrentUser } from '@/lib/actions/auth-user';
import { getOrdersByEmail } from '@/lib/actions/orders';
import { getMyReservations } from '@/lib/actions/reservations';
import { getLoyaltyProfileForUser } from '@/lib/loyalty/getLoyaltyProfile';
import { getLoyaltyConfig } from '@/lib/loyalty/config';
import type { SafeUser } from '@/components/account/account-forms';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contul Meu',
  description: "Gestionează contul tău River's Lounge — comenzi, rezervări și setări.",
  robots: { index: false, follow: false },
};

function deriveClientCode(userId: string): string {
  const suffix = userId.split('-').pop() ?? userId.slice(-4);
  return `RL-${suffix.toUpperCase()}`;
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  const [orders, reservations, loyaltyProfile, loyaltyConfig] = user
    ? await Promise.all([
        getOrdersByEmail(user.email),
        getMyReservations(),
        getLoyaltyProfileForUser(user.id),
        getLoyaltyConfig(),
      ])
    : await Promise.all([
        Promise.resolve([]),
        Promise.resolve([]),
        Promise.resolve(null),
        Promise.resolve(null),
      ]);

  const safeUser: SafeUser | null = user
    ? (({ passwordHash: _pw, ...rest }) => rest)(user)
    : null;

  const clientCode = user ? deriveClientCode(user.id) : null;
  const ordersRequired = loyaltyConfig?.level1.ordersRequired ?? 9;
  const loyaltyWidget = loyaltyProfile
    ? {
        currentLevel: loyaltyProfile.currentLevel,
        currentLevelName: loyaltyProfile.currentLevelName,
        totalCompletedOrders: loyaltyProfile.totalCompletedOrders,
        ordersRequired,
        hasActiveReward: loyaltyProfile.activeReward !== null,
        activeRewardValue: loyaltyProfile.activeReward?.rewardValue,
        walletBalance: loyaltyProfile.walletBalance,
        walletExpiresAt: loyaltyProfile.walletExpiresAt,
        priorityDelivery: loyaltyProfile.priorityDelivery,
        level3CashbackBoostLeft: loyaltyProfile.level3CashbackBoostLeft,
        totalReferrals: loyaltyProfile.totalReferrals,
        referralCashbackEarned: loyaltyProfile.referralCashbackEarned,
        referralCode: loyaltyProfile.referralCode,
        upgradeReferralsRequired: loyaltyConfig?.level4.upgradeReferralsRequired ?? 2,
      }
    : null;
  const upcomingCount = reservations.filter(
    (r) => new Date(r.date) >= new Date(new Date().toDateString()) && r.status !== 'refuzata'
  ).length;
  const lastOrder = orders[0] ?? null;
  const unreadNotifCount = reservations.reduce(
    (sum, r) => sum + (r.notifications ?? []).filter((n) => !n.isRead).length,
    0
  );

  return (
    <SiteLayout>
      <PageHero
        badge="Cont"
        title="Contul Meu"
        subtitle="Gestionează comenzile, rezervările și setările contului tău"
      />
      {!user && (
        <div className="mx-auto max-w-3xl px-4 lg:px-8 pt-8">
          <Link
            href="/cont/beneficii"
            className="flex items-center justify-between gap-4 rounded-2xl px-6 py-4 border transition-all hover:border-primary/50 hover:bg-primary/5 group"
            style={{ background: 'rgba(201,168,76,0.05)', borderColor: 'rgba(201,168,76,0.2)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Descoperă beneficiile membrilor
                </p>
                <p className="text-xs text-muted-foreground">
                  Un program special pentru cei care revin — în curând
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary shrink-0" />
          </Link>
        </div>
      )}

      {user && unreadNotifCount > 0 && (
        <div className="mx-auto max-w-3xl px-4 lg:px-8 pt-6">
          <Link
            href="/cont/rezervari"
            className="flex items-center justify-between gap-4 rounded-xl px-5 py-3.5 border transition-all hover:border-blue-400/50 group"
            style={{ background: 'rgba(59,130,246,0.07)', borderColor: 'rgba(59,130,246,0.25)' }}
          >
            <div className="flex items-center gap-3">
              <span style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, flexShrink: 0,
              }}>🔔</span>
              <p className="text-sm font-semibold" style={{ color: '#93C5FD' }}>
                Ai {unreadNotifCount} {unreadNotifCount === 1 ? 'notificare nouă' : 'notificări noi'} despre rezervările tale
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0" style={{ color: '#60A5FA' }} />
          </Link>
        </div>
      )}

      <AccountDashboard
        user={safeUser}
        initialOrders={orders}
        upcomingReservationsCount={upcomingCount}
        lastOrderDate={lastOrder?.createdAt ?? null}
        clientCode={clientCode}
        loyaltyWidget={loyaltyWidget}
      />
      {safeUser && <PasskeyPrompt />}
    </SiteLayout>
  );
}
