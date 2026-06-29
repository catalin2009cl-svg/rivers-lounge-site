import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// In-memory rate limit: max 3 submissions per IP per hour
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Prea multe cereri. Încearcă din nou mai târziu.' },
        { status: 429 }
      );
    }

    const body = await req.json() as {
      name?: unknown;
      email?: unknown;
      phone?: unknown;
      subject?: unknown;
      message?: unknown;
    };

    const { name, email, phone, subject, message } = body;

    if (
      typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || !email.trim() ||
      typeof subject !== 'string' || !subject.trim() ||
      typeof message !== 'string' || message.trim().length < 20
    ) {
      return NextResponse.json({ error: 'Date invalide.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalid.' }, { status: 400 });
    }

    await prisma.supportRequest.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: typeof phone === 'string' && phone.trim() ? phone.trim() : null,
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
