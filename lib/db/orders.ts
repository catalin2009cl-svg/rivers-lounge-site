import { prisma } from '../prisma';

export async function dbGetOrders() {
  return prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function dbGetOrderById(id: string) {
  return prisma.order.findUnique({ where: { id } });
}

export async function dbGetOrdersByUserId(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function dbGetOrdersByEmail(email: string) {
  return prisma.order.findMany({
    where: { userEmail: { equals: email, mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function dbCreateOrder(data: Record<string, unknown>) {
  return prisma.order.create({
    data: data as Parameters<typeof prisma.order.create>[0]['data'],
  });
}

export async function dbUpdateOrder(id: string, data: Record<string, unknown>) {
  return prisma.order.update({ where: { id }, data });
}

export async function dbDeleteOrder(id: string) {
  return prisma.order.delete({ where: { id } });
}
