import Link from 'next/link';
import {
  UtensilsCrossed,
  Newspaper,
  CalendarDays,
  ArrowRight,
  Star,
  Eye,
  ShoppingBag,
  CalendarCheck,
  TrendingUp,
  Megaphone,
  Soup,
} from 'lucide-react';
import {
  getMenuItems,
  getNewsPosts,
  getSpecialEvents,
  getPublishedPosts,
  getUpcomingEvents,
  getReservations,
  getOrders,
  getSettings,
  getUsers,
} from '@/lib/server-data';
import { checkUserRetention } from '@/lib/data-retention';
import { getGdprRequests } from '@/lib/actions/gdpr';
import { isBirthdayWindow, formatBirthday } from '@/lib/birthday-utils';
import { getSession } from '@/lib/auth';
import { PopupQuickToggle } from '@/components/admin/popup-quick-toggle';
import { DailyMenuQuickToggle } from '@/components/admin/daily-menu-quick-toggle';

export const dynamic = 'force-dynamic';

export const metadata = { title: "Dashboard Admin | River's Lounge" };

export default async function AdminDashboardPage() {
  const session = await getSession();
  const role = session?.role ?? 'admin';
  const isOperator = role === 'operator';
  const isManager = role === 'manager';

  if (isOperator || isManager) {
    // Operator / Manager dashboard — orders + reservations (+ content overview for manager)
    const [reservations, orders] = await Promise.all([getReservations(), getOrders()]);
    const newOrders = orders.filter((o) => o.status === 'noua').length;
    const newReservations = reservations.filter((r) => r.status === 'noua').length;
    const recentOrders = orders.filter((o) => o.status !== 'anulata');
    const revenue = recentOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

    return (
      <div className="p-6 lg:p-8 lg:pt-8 pt-20">
        <div className="mb-8">
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Bună ziua, <span className="text-primary">{session?.name}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isManager ? 'Panou manager — comenzi, rezervări și conținut' : 'Panou operator — comenzi și rezervări'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Comenzi noi',
              value: newOrders,
              sub: `${orders.length} total`,
              icon: ShoppingBag,
              href: '/admin/comenzi',
              color: 'text-blue-400',
              bg: 'bg-blue-500/10',
            },
            {
              label: 'Rezervări noi',
              value: newReservations,
              sub: `${reservations.length} total`,
              icon: CalendarCheck,
              href: '/admin/rezervari',
              color: 'text-green-400',
              bg: 'bg-green-500/10',
            },
            {
              label: 'Comenzi active',
              value: orders.filter((o) => !['livrata', 'anulata'].includes(o.status)).length,
              sub: 'în procesare',
              icon: TrendingUp,
              href: '/admin/comenzi',
              color: 'text-primary',
              bg: 'bg-primary/10',
            },
            {
              label: 'Venit total (RON)',
              value: revenue.toFixed(0),
              sub: 'comenzi non-anulate',
              icon: Star,
              href: '/admin/comenzi',
              color: 'text-yellow-400',
              bg: 'bg-yellow-500/10',
            },
          ].map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-5 hover:border-primary/40 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            </Link>
          ))}
        </div>

        {/* Recent orders */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white">Ultimele comenzi</h3>
            <Link href="/admin/comenzi" className="text-xs text-primary hover:underline">
              Vezi toate
            </Link>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/5 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {order.name} — {order.id}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('ro-RO')}
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary shrink-0 ml-2">
                  {order.total} RON
                </span>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nicio comandă primită.</p>
            )}
          </div>
        </div>

        {/* Manager-only quick actions */}
        {isManager && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Acces conținut</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { href: '/admin/meniu', label: 'Meniu', icon: UtensilsCrossed, desc: 'Editează produse' },
                { href: '/admin/noutati', label: 'Noutăți', icon: Newspaper, desc: 'Articole & promoții' },
                { href: '/admin/evenimente', label: 'Evenimente', icon: CalendarDays, desc: 'Seri speciale' },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-white/10 p-4 hover:border-primary/40 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <a.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-primary transition-colors">{a.label}</p>
                    <p className="text-xs text-gray-400">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Admin dashboard (full) ────────────────────────────────────────────────

  const [menuItems, posts, events, settings, allUsers, gdprRequests] = await Promise.all([
    getMenuItems(),
    getNewsPosts(),
    getSpecialEvents(),
    getSettings(),
    getUsers(),
    getGdprRequests(),
  ]);

  const now = new Date();
  const gdprPending = gdprRequests.filter((r) => r.status === 'pending').length;
  const gdprOverdue = gdprRequests.filter(
    (r) => r.status === 'pending' && new Date(r.deadline) < now
  ).length;

  const clientUsers = allUsers.filter((u) => u.role === 'client');
  const retentionSummary = clientUsers.map(checkUserRetention);
  const retentionWarn = retentionSummary.filter((r) => r.status === 'warn_soon' || r.status === 'notify_pending').length;
  const retentionEligible = retentionSummary.filter((r) => r.status === 'eligible_deletion').length;

  const bdayWindowDays = 3;
  const birthdayUsers = clientUsers.filter((u) => u.birthday && isBirthdayWindow(u.birthday, bdayWindowDays));

  const publishedPosts = getPublishedPosts(posts);
  const upcomingEvents = getUpcomingEvents(events);
  const popularItems = menuItems.filter((i) => i.popular && i.available);
  const unavailableItems = menuItems.filter((i) => !i.available);

  const stats = [
    {
      label: 'Produse în meniu',
      value: menuItems.length,
      sub: `${unavailableItems.length} indisponibile`,
      icon: UtensilsCrossed,
      href: '/admin/meniu',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Articole publicate',
      value: publishedPosts.length,
      sub: `${posts.length - publishedPosts.length} draft-uri`,
      icon: Newspaper,
      href: '/admin/noutati',
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Evenimente viitoare',
      value: upcomingEvents.length,
      sub: `${events.length} total`,
      icon: CalendarDays,
      href: '/admin/evenimente',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Produse populare',
      value: popularItems.length,
      sub: 'marcate ca populare',
      icon: Star,
      href: '/admin/meniu',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
  ];

  const quickActions = [
    { href: '/admin/meniu', label: 'Gestionează meniul', icon: UtensilsCrossed, desc: 'Adaugă, editează sau șterge produse' },
    { href: '/admin/noutati', label: 'Publică o noutate', icon: Newspaper, desc: 'Articole, promoții și meniul zilei' },
    { href: '/admin/evenimente', label: 'Adaugă un eveniment', icon: CalendarDays, desc: 'Seri speciale și petreceri la cabană' },
    { href: '/', label: 'Vezi site-ul live', icon: Eye, desc: 'Deschide pagina principală', external: true },
  ];

  return (
    <div className="p-6 lg:p-8 lg:pt-8 pt-20">
      <div className="mb-8">
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          Bun venit, <span className="text-primary">{session?.name ?? 'Administrator'}</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gestionează conținutul site-ului River&apos;s Lounge
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-5 hover:border-primary/40 transition-all duration-200 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Acțiuni rapide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              target={action.external ? '_blank' : undefined}
              className="flex items-center gap-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-white/10 p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-primary transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-gray-400 truncate">{action.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors ml-auto shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Popup Promo card */}
      {settings.popup !== undefined && (
        <div className="mb-8">
          <div className={`bg-white dark:bg-[#1a1a1a] rounded-2xl border p-5 transition-all ${
            settings.popup.enabled
              ? 'border-primary/30 dark:border-primary/30'
              : 'border-gray-100 dark:border-white/10'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  settings.popup.enabled ? 'bg-primary/10' : 'bg-gray-100 dark:bg-white/5'
                }`}>
                  <Megaphone className={`h-5 w-5 ${settings.popup.enabled ? 'text-primary' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">Popup Promoțional</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      settings.popup.enabled
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-500'
                    }`}>
                      {settings.popup.enabled ? '● ACTIV' : '○ INACTIV'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {settings.popup.title?.trim()
                      ? settings.popup.title
                      : 'Niciun titlu setat'}
                    {settings.popup.expiresAt && (
                      <span className={`ml-2 ${
                        new Date(settings.popup.expiresAt) < new Date()
                          ? 'text-yellow-500'
                          : 'text-gray-400'
                      }`}>
                        · Expiră {new Date(settings.popup.expiresAt).toLocaleDateString('ro-RO')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:shrink-0">
                <PopupQuickToggle enabled={settings.popup.enabled} />
                <Link
                  href="/admin/popup"
                  className="text-xs text-primary hover:underline whitespace-nowrap"
                >
                  Editează →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meniu Zilei card */}
      {settings.dailyMenu !== undefined && (
        <div className="mb-8">
          <div className={`bg-white dark:bg-[#1a1a1a] rounded-2xl border p-5 transition-all ${
            settings.dailyMenu.enabled
              ? 'border-primary/30 dark:border-primary/30'
              : 'border-gray-100 dark:border-white/10'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  settings.dailyMenu.enabled ? 'bg-primary/10' : 'bg-gray-100 dark:bg-white/5'
                }`}>
                  <Soup className={`h-5 w-5 ${settings.dailyMenu.enabled ? 'text-primary' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">Meniu Zilei</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      settings.dailyMenu.enabled
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-500'
                    }`}>
                      {settings.dailyMenu.enabled ? '● ACTIV' : '○ INACTIV'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {settings.dailyMenu.title?.trim()
                      ? `${settings.dailyMenu.type === 'meniu-zilei' ? '🍽️' : '☀️'} ${settings.dailyMenu.title} · ${settings.dailyMenu.price} RON${settings.dailyMenu.validUntil ? ` · până la ${settings.dailyMenu.validUntil}` : ''}`
                      : settings.dailyMenu.schedule?.enabled
                        ? 'Program săptămânal activ'
                        : 'Niciun conținut setat'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:shrink-0">
                <DailyMenuQuickToggle enabled={settings.dailyMenu.enabled} />
                <Link href="/admin/meniu-zilei" className="text-xs text-primary hover:underline whitespace-nowrap">
                  Editează →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {gdprPending > 0 && (
        <div className="mb-8">
          <Link
            href="/admin/gdpr"
            className="block bg-white dark:bg-[#1a1a1a] rounded-2xl border border-blue-500/30 dark:border-blue-500/20 p-5 hover:border-blue-500/60 transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">⚖️</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">Cereri GDPR active</p>
                  <div className="space-y-0.5">
                    <p className="text-xs text-blue-400">
                      ⏳ {gdprPending} {gdprPending === 1 ? 'cerere în așteptare' : 'cereri în așteptare'}
                    </p>
                    {gdprOverdue > 0 && (
                      <p className="text-xs text-red-400">
                        🔴 {gdprOverdue} {gdprOverdue === 1 ? 'cerere depășită (30 zile)' : 'cereri depășite (30 zile)'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-primary transition-colors shrink-0">
                <span>Procesează</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {(retentionWarn > 0 || retentionEligible > 0) && (
        <div className="mb-8">
          <Link
            href="/admin/utilizatori"
            className="block bg-white dark:bg-[#1a1a1a] rounded-2xl border border-orange-500/30 dark:border-orange-500/20 p-5 hover:border-orange-500/60 transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">🗑️</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">Retenție Date GDPR</p>
                  <div className="space-y-0.5">
                    {retentionWarn > 0 && (
                      <p className="text-xs text-orange-500 dark:text-orange-400">
                        ⚠️ {retentionWarn} {retentionWarn === 1 ? 'cont aproape de expirare' : 'conturi aproape de expirare'}
                      </p>
                    )}
                    {retentionEligible > 0 && (
                      <p className="text-xs text-red-500 dark:text-red-400">
                        🔴 {retentionEligible} {retentionEligible === 1 ? 'cont eligibil pentru ștergere' : 'conturi eligibile pentru ștergere'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-primary transition-colors shrink-0">
                <span>Vezi raport</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {birthdayUsers.length > 0 && (
        <div className="mb-8">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border p-5" style={{ borderColor: 'rgba(201,168,76,0.35)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎂</span>
                <h3 className="font-semibold text-gray-800 dark:text-white">
                  Clienți cu ziua de naștere în această perioadă
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
                  {birthdayUsers.length}
                </span>
              </div>
              <Link href="/admin/utilizatori" className="text-xs text-primary hover:underline whitespace-nowrap">
                Vezi utilizatori →
              </Link>
            </div>
            <div className="space-y-2">
              {birthdayUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 dark:border-white/5 last:border-0 flex-wrap"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{u.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium" style={{ color: '#C9A84C' }}>
                      {u.birthday ? formatBirthday(u.birthday) : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white">Ultimele noutăți</h3>
            <Link href="/admin/noutati" className="text-xs text-primary hover:underline">
              Vezi toate
            </Link>
          </div>
          <div className="space-y-3">
            {posts.slice(0, 5).map((post) => (
              <div key={post.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/5 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{post.title}</p>
                  <p className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString('ro-RO')}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                  post.status === 'published'
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : post.status === 'scheduled'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-500'
                }`}>
                  {post.status === 'published' ? 'Publicat' : post.status === 'scheduled' ? 'Programat' : 'Draft'}
                </span>
              </div>
            ))}
            {posts.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nicio noutate adăugată.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white">Evenimente viitoare</h3>
            <Link href="/admin/evenimente" className="text-xs text-primary hover:underline">
              Gestionează
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Niciun eveniment viitor.</p>
              <Link href="/admin/evenimente" className="text-xs text-primary hover:underline mt-1 block">
                Adaugă primul eveniment →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/5 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{event.title}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(event.date).toLocaleDateString('ro-RO')} {event.time && `• ${event.time}`}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0 ml-2">
                    {event.location}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
