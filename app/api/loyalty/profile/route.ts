import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByEmail } from '@/lib/server-data';
import { getLoyaltyProfileForUser } from '@/lib/loyalty/getLoyaltyProfile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const email = cookieStore.get('user_email')?.value;
  if (!email) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Utilizator negăsit' }, { status: 404 });

  const profile = await getLoyaltyProfileForUser(user.id);
  return NextResponse.json({ profile });
}
