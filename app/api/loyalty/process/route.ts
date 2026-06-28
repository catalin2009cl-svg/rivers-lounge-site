import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { processOrderForLoyalty } from '@/lib/loyalty/processLoyalty';

export const dynamic = 'force-dynamic';

// Internal endpoint — only callable from server-side (admin session required)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const body = await req.json() as { orderId: string; userId: string; orderSubtotal?: number };
  if (!body.orderId || !body.userId) {
    return NextResponse.json({ error: 'orderId și userId sunt obligatorii' }, { status: 400 });
  }

  const result = await processOrderForLoyalty(body.orderId, body.userId, body.orderSubtotal ?? 0);
  return NextResponse.json({ result });
}
