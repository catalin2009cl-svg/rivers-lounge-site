import { SiteLayout } from '@/components/layout/site-layout';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata = {
  title: 'Ai uitat parola? | Rivers Lounge',
  description: 'Resetează parola contului tău Rivers Lounge.',
};

export default function UitareParolaPage() {
  return (
    <SiteLayout>
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center py-16 px-4">
        <ForgotPasswordForm />
      </section>
    </SiteLayout>
  );
}
