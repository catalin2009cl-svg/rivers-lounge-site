import Link from 'next/link';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = { title: "Acces Restricționat | Admin River's Lounge" };

export default async function AccessDeniedPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⛔</span>
        </div>

        <h1 className="font-serif text-2xl font-bold text-white mb-2">
          Acces Restricționat
        </h1>

        <p className="text-[#9A9490] mb-2">
          Nu ai permisiunile necesare pentru această secțiune.
        </p>

        {session && (
          <p className="text-sm text-[#9A9490] mb-6">
            Ești autentificat ca{' '}
            <span className="text-[#C9A84C] font-medium">{session.name}</span>{' '}
            cu rolul{' '}
            <span className="text-[#C9A84C] font-medium capitalize">{session.role}</span>.
          </p>
        )}

        <p className="text-sm text-[#9A9490] mb-8">
          Contactează administratorul pentru a solicita acces la această funcționalitate.
        </p>

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 bg-[#C9A84C] text-[#0F0F0F] font-bold px-6 py-3 rounded-xl hover:bg-[#C9A84C]/90 transition-colors"
        >
          ← Înapoi la Dashboard
        </Link>
      </div>
    </div>
  );
}
