import { prisma } from '../prisma';

export async function dbGetSettings<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.siteSettings.findUnique({ where: { key } });
  return row ? (row.value as T) : fallback;
}

export async function dbSaveSettings(key: string, value: unknown): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { key },
    update: { value: value as never },
    create: { key, value: value as never },
  });
}
