import Link from 'next/link';

export const metadata = { title: "Dezabonare email | River's Lounge" };

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { done?: string; error?: string };
}) {
  const done  = searchParams.done === '1';
  const error = searchParams.error;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">{done ? '✅' : error ? '❌' : '📧'}</div>

        {done && (
          <>
            <h1 className="font-serif text-2xl font-bold text-foreground">Dezabonat cu succes</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Adresa ta de email a fost eliminată din lista noastră de marketing. Nu vei mai primi
              emailuri promoționale de la River&apos;s Lounge.
            </p>
            <p className="text-muted-foreground text-sm">
              Poți reactiva oricând din{' '}
              <Link href="/cont/setari" className="text-primary hover:underline">
                setările contului tău
              </Link>
              .
            </p>
          </>
        )}

        {error && (
          <>
            <h1 className="font-serif text-2xl font-bold text-foreground">Link invalid</h1>
            <p className="text-muted-foreground text-sm">
              Linkul de dezabonare este invalid sau a expirat. Încearcă din nou din emailul original.
            </p>
          </>
        )}

        {!done && !error && (
          <>
            <h1 className="font-serif text-2xl font-bold text-foreground">Dezabonare</h1>
            <p className="text-muted-foreground text-sm">Procesăm cererea ta...</p>
          </>
        )}

        <Link
          href="/"
          className="inline-block mt-4 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Înapoi la site
        </Link>
      </div>
    </main>
  );
}
