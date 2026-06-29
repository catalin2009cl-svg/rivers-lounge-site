import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const user = await prisma.user.findUnique({
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
          take: 30,
          select: {
            id: true,
            status: true,
            total: true,
            subtotal: true,
            deliveryFee: true,
            orderType: true,
            paymentMethod: true,
            items: true,
            createdAt: true,
            isPriority: true,
          },
        },
        reservations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            location: true,
            date: true,
            time: true,
            guests: true,
            status: true,
            eventType: true,
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
            walletTransactions: {
              orderBy: { createdAt: 'desc' },
              take: 15,
              select: {
                id: true,
                type: true,
                amount: true,
                description: true,
                createdAt: true,
              },
            },
          },
        },
        referralsMade: {
          include: {
            referredUser: {
              select: { id: true, name: true, email: true, createdAt: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
