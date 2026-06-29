import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByEmail } from '@/lib/server-data';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type BonusChoice = 'WALLET_DOUBLE' | 'CASHBACK_BOOST';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const email = cookieStore.get('user_email')?.value;
  if (!email) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Utilizator negăsit' }, { status: 404 });

  const body = await req.json() as { choice?: BonusChoice };
  const { choice } = body;
  if (choice !== 'WALLET_DOUBLE' && choice !== 'CASHBACK_BOOST') {
    return NextResponse.json({ error: 'Alegere invalidă' }, { status: 400 });
  }

  const profile = await prisma.loyaltyProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      currentLevel: true,
      level3BonusChoice: true,
      level3BonusExpiresAt: true,
      walletBalance: true,
    },
  });

  if (!profile) return NextResponse.json({ error: 'Profil negăsit' }, { status: 404 });
  if (profile.currentLevel < 3) return NextResponse.json({ error: 'Nu ești Client Premium' }, { status: 403 });
  if (profile.level3BonusChoice) return NextResponse.json({ error: 'Ai ales deja bonusul' }, { status: 409 });
  if (!profile.level3BonusExpiresAt || new Date(profile.level3BonusExpiresAt) <= new Date()) {
    return NextResponse.json({ error: 'Fereastra de alegere a expirat' }, { status: 410 });
  }

  const now = new Date();

  if (choice === 'WALLET_DOUBLE') {
    const bonusAmount = Math.round(profile.walletBalance * 100) / 100;
    if (bonusAmount > 0) {
      await prisma.$transaction(async (tx) => {
        const current = await tx.loyaltyProfile.findUnique({
          where: { id: profile.id },
          select: { walletBalance: true },
        });
        const balanceBefore = current?.walletBalance ?? 0;
        const balanceAfter = Math.round(balanceBefore * 2 * 100) / 100;

        await tx.loyaltyProfile.update({
          where: { id: profile.id },
          data: {
            walletBalance: balanceAfter,
            level3BonusChoice: choice,
            level3BonusChosenAt: now,
          },
        });

        await tx.walletTransaction.create({
          data: {
            loyaltyProfileId: profile.id,
            userId: user.id,
            type: 'LEVEL_BONUS',
            amount: bonusAmount,
            balanceBefore,
            balanceAfter,
            description: 'Bonus Client Premium — Portofel Dublat',
          },
        });
      });
    } else {
      await prisma.loyaltyProfile.update({
        where: { id: profile.id },
        data: { level3BonusChoice: choice, level3BonusChosenAt: now },
      });
    }
  } else {
    // CASHBACK_BOOST
    await prisma.loyaltyProfile.update({
      where: { id: profile.id },
      data: {
        level3BonusChoice: choice,
        level3BonusChosenAt: now,
        level3CashbackBoostLeft: 10,
      },
    });
  }

  return NextResponse.json({ success: true, choice });
}
