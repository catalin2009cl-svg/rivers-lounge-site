import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { LoginForm } from '@/components/account/account-forms';

export const metadata = {
  title: "Autentificare | River's Lounge",
};

export default function LoginPage() {
  return (
    <SiteLayout>
      <PageHero title="Autentificare" subtitle="Accesează contul tău" />
      <section className="py-12">
        <LoginForm />
      </section>
    </SiteLayout>
  );
}
