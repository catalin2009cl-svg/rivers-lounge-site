'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Newspaper,
  CalendarDays,
  CalendarCheck,
  Images,
  Globe2,
  Settings2,
  LogOut,
  Menu,
  X,
  Waves,
  ExternalLink,
  ShoppingBag,
  Users,
  Archive,
  Megaphone,
  ShieldCheck,
  Soup,
  Star,
  Wrench,
  Gift,
  FileText,
} from 'lucide-react';
import { logoutAction } from '@/lib/actions/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import type { AdminRole } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/admin',             label: 'Dashboard',           icon: LayoutDashboard, exact: true,  permission: 'dashboard.view'  as Permission },
  { href: '/admin/comenzi',     label: 'Comenzi',             icon: ShoppingBag,     exact: false, permission: 'comenzi.view'    as Permission, badge: 'orders' },
  { href: '/admin/rezervari',   label: 'Rezervări',           icon: CalendarCheck,   exact: false, permission: 'rezervari.view'  as Permission, badge: 'reservations' },
  { href: '/admin/utilizatori', label: 'Utilizatori',         icon: Users,           exact: false, permission: 'utilizatori.view' as Permission },
  { href: '/admin/loialitate',  label: 'Program Loialitate',  icon: Gift,            exact: false, permission: 'loialitate.view'  as Permission },
  { href: '/admin/meniu',       label: 'Meniu',               icon: UtensilsCrossed, exact: false, permission: 'meniu.view'       as Permission },
  { href: '/admin/meniu-zilei', label: 'Meniu Zilei',         icon: Soup,            exact: false, permission: 'meniu-zilei.view' as Permission },
  { href: '/admin/noutati',     label: 'Noutăți',             icon: Newspaper,       exact: false, permission: 'noutati.view'     as Permission },
  { href: '/admin/evenimente',  label: 'Evenimente Speciale', icon: CalendarDays,    exact: false, permission: 'evenimente.view' as Permission },
  { href: '/admin/media',       label: 'Media',               icon: Images,          exact: false, permission: 'media.view'      as Permission },
  { href: '/admin/social',      label: 'Social Media',        icon: Globe2,          exact: false, permission: 'social.view'     as Permission },
  { href: '/admin/recenzii',    label: 'Recenzii',            icon: Star,            exact: false, permission: 'recenzii.view'   as Permission },
  { href: '/admin/rapoarte',    label: 'Rapoarte',            icon: FileText,        exact: false, permission: 'rapoarte.view'   as Permission },
  { href: '/admin/popup',        label: 'Popup Promoțional',   icon: Megaphone,       exact: false, permission: 'popup.view'      as Permission },
  { href: '/admin/setari',      label: 'Setări Site',         icon: Settings2,       exact: false, permission: 'setari.view'     as Permission },
  { href: '/admin/gdpr',        label: 'GDPR & Date',         icon: ShieldCheck,     exact: false, permission: 'gdpr.view'       as Permission },
  { href: '/admin/arhiva',      label: 'Arhivă',              icon: Archive,         exact: false, permission: 'arhiva.view'      as Permission },
  { href: '/admin/mentenanta',  label: 'Mod Mentenanță',      icon: Wrench,          exact: false, permission: 'mentenanta.view'  as Permission },
] as const;

// ── Role badge config ─────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<AdminRole, { label: string; className: string }> = {
  admin:    { label: 'Admin 👑',    className: 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30' },
  manager:  { label: 'Manager 🔧',  className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  operator: { label: 'Operator 📦', className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface AdminSidebarProps {
  newReservationsCount?: number;
  newOrdersCount?: number;
  role?: AdminRole;
  adminName?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminSidebar({
  newReservationsCount = 0,
  newOrdersCount = 0,
  role = 'admin',
  adminName = 'Administrator',
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(role, item.permission));
  const roleConfig = ROLE_CONFIG[role] ?? ROLE_CONFIG.operator;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + role badge */}
      <div className="px-4 py-3 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-3 mb-2" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Waves className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">River&apos;s Lounge</p>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </Link>

        {/* Role badge + name */}
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${roleConfig.className}`}>
            {roleConfig.label}
          </span>
          <span className="text-xs text-gray-400 truncate">{adminName}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const active =
            isActive(item.href, item.exact) ||
            (item.href === '/admin/comenzi' && pathname.startsWith('/admin/arhiva'));
          const badgeCount =
            'badge' in item && item.badge === 'orders'       ? newOrdersCount :
            'badge' in item && item.badge === 'reservations' ? newReservationsCount : 0;
          const badgeBg =
            'badge' in item && item.badge === 'reservations' ? 'bg-red-500' : 'bg-primary';

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 ${
                active
                  ? 'bg-primary/20 text-primary'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
              {badgeCount > 0 && (
                <span className={`ml-auto ${badgeBg} text-white text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1 leading-none`}>
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="px-2 py-2 border-t border-white/10 space-y-0.5">
        <div className="flex items-center gap-2.5 px-3 py-1">
          <span className="text-xs text-gray-500">Temă site</span>
          <ThemeToggle className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/5" />
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          Vezi site-ul
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Deconectare
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#1a1a1a] border-r border-white/10 shrink-0 sticky top-0 h-screen z-[9999]">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-white">Admin</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 left-0 bottom-0 w-64 bg-[#1a1a1a] border-r border-white/10 pt-14">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
