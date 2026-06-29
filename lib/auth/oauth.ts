import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export interface OAuthUserInput {
  provider: 'google' | 'facebook';
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export async function findOrCreateOAuthUser(input: OAuthUserInput) {
  const { provider, providerId, email, name, avatarUrl } = input;

  // 1. Find by OAuth provider ID (returning user)
  const byProvider =
    provider === 'google'
      ? await prisma.user.findUnique({ where: { googleId: providerId } })
      : await prisma.user.findUnique({ where: { facebookId: providerId } });

  if (byProvider) {
    return prisma.user.update({
      where: { id: byProvider.id },
      data: { lastLoginAt: new Date(), lastActivityAt: new Date() },
    });
  }

  // 2. Find by email and link provider
  const byEmail = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        ...(provider === 'google' ? { googleId: providerId } : { facebookId: providerId }),
        authProvider: byEmail.authProvider ?? provider,
        ...(avatarUrl && !byEmail.avatarUrl ? { avatarUrl } : {}),
        lastLoginAt: new Date(),
        lastActivityAt: new Date(),
      },
    });
  }

  // 3. Create new OAuth-only user
  return prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      name,
      passwordHash: '',
      ...(provider === 'google' ? { googleId: providerId } : { facebookId: providerId }),
      authProvider: provider,
      avatarUrl: avatarUrl ?? null,
      isActive: true,
      isVerified: false,
      clientCode: `RL-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      lastLoginAt: new Date(),
      lastActivityAt: new Date(),
    },
  });
}
