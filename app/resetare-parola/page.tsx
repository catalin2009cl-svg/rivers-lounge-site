import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { ResetPasswordForm } from './ResetPasswordForm';

export const metadata = {
  title: 'Resetare Parolă | Rivers Lounge',
  description: 'Setează o nouă parolă pentru contul tău Rivers Lounge.',
};

export default function ResetareParolaPage() {
  return (
    <SiteLayout>
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center py-16 px-4">
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </section>
    </SiteLayout>
  );
}
