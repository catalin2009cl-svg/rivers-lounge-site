import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { RegisterForm } from '@/components/account/account-forms';

export const metadata = {
  title: "Înregistrare | River's Lounge",
};

export default function RegisterPage() {
  return (
    <SiteLayout>
      <PageHero title="Înregistrare" subtitle="Creează un cont nou" />
      <section className="py-12">
        <RegisterForm />
      </section>
    </SiteLayout>
  );
}
