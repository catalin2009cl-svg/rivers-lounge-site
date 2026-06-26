import { prisma } from '../prisma';

export async function dbGetUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function dbGetUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function dbGetUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function dbCreateUser(data: {
  id: string;
  email: string;
  name: string;
  phone?: string;
  passwordHash: string;
  clientCode: string;
  role?: string;
  createdAt?: Date;
  lastLoginAt?: Date;
}) {
  return prisma.user.create({ data });
}

export async function dbUpdateUser(id: string, data: Record<string, unknown>) {
  return prisma.user.update({ where: { id }, data });
}

export async function dbDeleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

export async function dbDeleteUsers(ids: string[]) {
  return prisma.user.deleteMany({ where: { id: { in: ids } } });
}

export async function dbUpsertUsers(users: Array<Record<string, unknown>>) {
  const results = [];
  for (const u of users) {
    results.push(
      await prisma.user.upsert({
        where: { id: u.id as string },
        update: u,
        create: u as Parameters<typeof prisma.user.create>[0]['data'],
      })
    );
  }
  return results;
}
