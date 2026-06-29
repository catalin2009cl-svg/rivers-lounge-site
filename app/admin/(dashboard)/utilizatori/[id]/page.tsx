import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserProfilePageClient, type UserProfileFull } from './UserProfilePageClient';

export const dynamic = 'force-dynamic';

async function getUserProfile(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      clientCode: true,
      avatar: true,
      birthday: true,
      isActive: true,
      isVerified: true,
      verifiedAt: true,
      verifiedBy: true,
      totalOrders: true,
      totalSpent: true,
      lastActivityAt: true,
      lastLoginAt: true,
      lastOrderAt: true,
      adminNote: true,
      role: true,
      createdAt: true,
      referredByCode: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          status: true,
          total: true,
          subtotal: true,
          deliveryFee: true,
          orderType: true,
          paymentMethod: true,
          items: true,
          address: true,
          city: true,
          createdAt: true,
          isPriority: true,
        },
      },
      reservations: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          location: true,
          date: true,
          time: true,
          guests: true,
          status: true,
          eventType: true,
          notes: true,
          createdAt: true,
        },
      },
      loyaltyProfile: {
        select: {
          currentLevel: true,
          currentTier: true,
          walletBalance: true,
          totalCashbackEarned: true,
          totalCompletedOrders: true,
          totalSpentEligible: true,
          referralCode: true,
          totalReferrals: true,
          referralCashbackEarned: true,
          welcomeBonusActive: true,
          priorityDelivery: true,
          level3BonusChoice: true,
          firstCompletedOrderAt: true,
          lastCompletedOrderAt: true,
          createdAt: true,
          walletTransactions: {
            orderBy: { createdAt: 'desc' },
            take: 30,
            select: {
              id: true,
              type: true,
              amount: true,
              balanceBefore: true,
              balanceAfter: true,
              description: true,
              createdAt: true,
            },
          },
        },
      },
      referralsMade: {
        include: {
          referredUser: {
            select: { id: true, name: true, email: true, createdAt: true, totalOrders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { name: true } });
  return { title: user ? `${user.name} | Admin Rivers Lounge` : 'Profil utilizator | Admin' };
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const raw = await getUserProfile(id);
  if (!raw) notFound();
  // JSON round-trip converts Prisma Date objects to ISO strings for client component
  const user = JSON.parse(JSON.stringify(raw)) as UserProfileFull;

  return (
    <div className="p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#9A9490] mb-6">
        <Link href="/admin/utilizatori" className="hover:text-[#F0EDE6] transition-colors">
          Utilizatori
        </Link>
        <span>/</span>
        <span className="text-[#F0EDE6]">{user.name}</span>
      </div>

      <UserProfilePageClient user={user} />
    </div>
  );
}
