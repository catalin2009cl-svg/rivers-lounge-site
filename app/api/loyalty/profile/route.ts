import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByEmail } from '@/lib/server-data';
import { getLoyaltyProfileForUser } from '@/lib/loyalty/getLoyaltyProfile';
import { expireLevel3BonusIfNeeded } from '@/lib/loyalty/expireLevel3Bonus';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const email = cookieStore.get('user_email')?.value;
  if (!email) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Utilizator negăsit' }, { status: 404 });

  await expireLevel3BonusIfNeeded(user.id);
  const profile = await getLoyaltyProfileForUser(user.id);
  return NextResponse.json({ profile });
}
