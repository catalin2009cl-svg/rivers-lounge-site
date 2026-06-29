import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SupportAdminClient } from './SupportAdminClient';

export const dynamic = 'force-dynamic';

export const metadata = { title: "Suport Clienți | Admin River's Lounge" };

export default async function AdminSupportPage() {
  await requireAuth();

  const requests = await prisma.supportRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const data = requests.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone ?? null,
    subject: r.subject,
    message: r.message,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="p-6 lg:p-8 pt-20 lg:pt-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-white">
          💬 Suport Clienți
        </h1>
        <p className="text-gray-400 mt-1">
          Mesaje primite prin formularul de suport
        </p>
      </div>
      <SupportAdminClient initialRequests={data} />
    </div>
  );
}
