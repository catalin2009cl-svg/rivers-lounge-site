'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin/comenzi', label: 'Comenzi active' },
  { href: '/admin/arhiva', label: 'Arhivă & Istoric' },
];

export function OrdersSubNav() {
  const pathname = usePathname();

  return (
    <div className="flex border-b border-[#2E2E2E] mb-6">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative px-4 py-2.5 text-sm transition-colors ${
              active ? 'text-white font-semibold' : 'text-[#9A9490] hover:text-white'
            }`}
          >
            {tab.label}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A84C] rounded-t" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
