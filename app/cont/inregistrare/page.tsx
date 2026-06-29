import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { RegisterForm } from '@/components/account/account-forms';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Înregistrare | River's Lounge",
};

interface Props {
  searchParams: Promise<{ ref?: string }>;
}

export default async function RegisterPage({ searchParams }: Props) {
  const params = await searchParams;
  const refCode = (params.ref ?? '').trim().toUpperCase();

  return (
    <SiteLayout>
      <PageHero title="Înregistrare" subtitle="Creează un cont nou" />
      <section className="py-12">
        <RegisterForm defaultReferralCode={refCode} hasGoogle hasFacebook />
      </section>
    </SiteLayout>
  );
}
