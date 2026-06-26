import { prisma } from '../prisma';

export async function dbGetReviews() {
  return prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function dbReplaceReviews(reviews: Array<{
  name: string;
  rating: number;
  text: string;
  date?: string | null;
  source?: string;
  approved?: boolean;
  featured?: boolean;
}>) {
  await prisma.review.deleteMany({});
  return prisma.review.createMany({ data: reviews });
}
