import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendBirthdayEmail } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const todayMM = String(now.getMonth() + 1).padStart(2, '0');
    const todayDD = String(now.getDate()).padStart(2, '0');
    const todayMMDD = `${todayMM}-${todayDD}`;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const expiresAt = new Date(todayStart.getTime() + 15 * 24 * 60 * 60 * 1000);

    // Find users whose birthDate MM-DD matches today, haven't received credit today
    const users = await prisma.user.findMany({
      where: {
        birthDate: { not: null },
        isActive: true,
        OR: [
          { lastBirthdayReward: null },
          { lastBirthdayReward: { lt: todayStart } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        birthDate: true,
        lastBirthdayReward: true,
        loyaltyProfile: { select: { id: true, walletBalance: true } },
      },
    });

    let credited = 0;
    for (const user of users) {
      if (!user.birthDate) continue;

      const bd = new Date(user.birthDate);
      const bdMM = String(bd.getMonth() + 1).padStart(2, '0');
      const bdDD = String(bd.getDate()).padStart(2, '0');
      if (`${bdMM}-${bdDD}` !== todayMMDD) continue;

      // Calculate age
      const age = now.getFullYear() - bd.getFullYear();
      if (age < 1 || age > 120) continue;
      const creditAmount = age;

      // Ensure loyalty profile exists
      let profile = user.loyaltyProfile;
      if (!profile) {
        profile = await prisma.loyaltyProfile.create({
          data: { userId: user.id, referralCode: `RL${user.id.slice(-6).toUpperCase()}` },
          select: { id: true, walletBalance: true },
        });
      }

      const balanceBefore = profile.walletBalance;
      const balanceAfter = balanceBefore + creditAmount;

      await prisma.$transaction([
        prisma.loyaltyProfile.update({
          where: { id: profile.id },
          data: { walletBalance: balanceAfter },
        }),
        prisma.walletTransaction.create({
          data: {
            loyaltyProfileId: profile.id,
            userId: user.id,
            type: 'BIRTHDAY_CREDIT',
            amount: creditAmount,
            balanceBefore,
            balanceAfter,
            description: `Credit de ziua de naștere — ${age} ani`,
            expiresAt,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { lastBirthdayReward: now },
        }),
      ]);

      try {
        await sendBirthdayEmail(user.email, user.name, creditAmount);
      } catch {
        // non-fatal
      }
      credited++;
    }

    return NextResponse.json({ ok: true, credited });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
