import { getUsers, getOrders, getOperators } from '@/lib/server-data';
import type { Operator } from '@/lib/server-data';
import { getRetentionReport } from '@/lib/actions/users';
import type { RetentionCheckResult } from '@/lib/data-retention';
import { getSession } from '@/lib/auth';
import { UsersAdminClient } from '@/components/admin/users-admin-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Utilizatori | Admin River's Lounge",
};

export type SafeOperator = Omit<Operator, 'passwordHash'>;

function stripPasswordHash(op: Operator): SafeOperator {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safe } = op;
  return safe;
}

export default async function UsersPage() {
  const [users, orders, operators, retentionReport, session] = await Promise.all([
    getUsers(),
    getOrders(),
    getOperators(),
    getRetentionReport(),
    getSession(),
  ]);

  const safeOperators: SafeOperator[] = operators.map(stripPasswordHash);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F0EDE6]">Utilizatori</h1>
        <p className="text-sm text-[#9A9490] mt-1">
          Clienți înregistrați și operatori administrativi.
        </p>
      </div>
      <UsersAdminClient
        initialUsers={users}
        allOrders={orders}
        initialOperators={safeOperators}
        initialRetentionReport={retentionReport}
        canVerify={session?.role === 'admin'}
        adminName={session?.name ?? 'Administrator'}
      />
    </div>
  );
}
