import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/actions/auth-user';
import { getSavedAddresses } from '@/lib/actions/users';
import { SiteLayout } from '@/components/layout/site-layout';
import { MySettingsClient } from '@/components/account/my-settings-client';
import type { SafeUser } from '@/components/account/account-forms';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Setări Cont | River's Lounge",
};

function deriveClientCode(userId: string): string {
  const suffix = userId.split('-').pop() ?? userId.slice(-4);
  return `RL-${suffix.toUpperCase()}`;
}

export default async function MySetariPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/cont/autentificare');

  const savedAddresses = await getSavedAddresses();

  const safeUser: SafeUser = (({ passwordHash: _pw, ...rest }) => rest)(user);
  const clientCode = deriveClientCode(user.id);

  return (
    <SiteLayout>
      <section className="py-10">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <div className="mb-8">
            <Link
              href="/cont"
              style={{ fontSize: 13, color: '#9A9490', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}
            >
              ← Înapoi la cont
            </Link>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE6', fontFamily: 'serif' }}>
              ⚙️ Setări Cont
            </h1>
            <p style={{ color: '#9A9490', fontSize: 14, marginTop: 4 }}>
              {user.name} · {user.email}
            </p>
          </div>
          <MySettingsClient
            user={safeUser}
            clientCode={clientCode}
            savedAddresses={savedAddresses}
          />
        </div>
      </section>
    </SiteLayout>
  );
}
