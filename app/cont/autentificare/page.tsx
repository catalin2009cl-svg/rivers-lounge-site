import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { LoginForm } from '@/components/account/account-forms';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Autentificare | River's Lounge",
};

export default function LoginPage() {
  return (
    <SiteLayout>
      <PageHero title="Autentificare" subtitle="Accesează contul tău" />
      <section className="py-12">
        <LoginForm
          hasGoogle={!!process.env.GOOGLE_CLIENT_ID}
          hasFacebook={!!process.env.FACEBOOK_CLIENT_ID}
        />
      </section>
    </SiteLayout>
  );
}
