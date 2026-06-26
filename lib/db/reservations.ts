import { prisma } from '../prisma';

export async function dbGetReservations() {
  return prisma.reservation.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function dbGetReservationById(id: string) {
  return prisma.reservation.findUnique({ where: { id } });
}

export async function dbCreateReservation(data: Record<string, unknown>) {
  return prisma.reservation.create({
    data: data as Parameters<typeof prisma.reservation.create>[0]['data'],
  });
}

export async function dbUpdateReservation(id: string, data: Record<string, unknown>) {
  return prisma.reservation.update({ where: { id }, data });
}

export async function dbDeleteReservation(id: string) {
  return prisma.reservation.delete({ where: { id } });
}
