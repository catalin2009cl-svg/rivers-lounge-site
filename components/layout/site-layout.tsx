import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { DailyMenuBanner } from '@/components/daily-menu/daily-menu-banner';
import { getCurrentUser } from '@/lib/actions/auth-user';
import { getSettings } from '@/lib/server-data';
import { getTodaysDailyMenu } from '@/lib/actions/settings';
import { getMyReservations } from '@/lib/actions/reservations';

interface SiteLayoutProps {
  children: React.ReactNode;
}

export async function SiteLayout({ children }: SiteLayoutProps) {
  const [user, settings, dailyMenuData] = await Promise.all([
    getCurrentUser(),
    getSettings(),
    getTodaysDailyMenu(),
  ]);
  const branding = settings.branding;

  let unreadNotificationsCount = 0;
  if (user) {
    try {
      const myReservations = await getMyReservations();
      unreadNotificationsCount = myReservations.reduce(
        (sum, r) => sum + (r.notifications ?? []).filter((n) => !n.isRead).length,
        0
      );
    } catch { /* non-critical */ }
  }

  return (
    <>
      <Header userName={user?.name} orderCount={user?.totalOrders} branding={branding} isVerified={user?.isVerified} userAvatar={user?.avatar} unreadNotificationsCount={unreadNotificationsCount} />
      {/* 80px clears the fixed header (nav 68px + border 1px + drift 7px = 80px) */}
      <div style={{ marginTop: 80 }} />
      {dailyMenuData?.showAsBanner && <DailyMenuBanner data={dailyMenuData} />}
      <main>{children}</main>
      <Footer />
    </>
  );
}
