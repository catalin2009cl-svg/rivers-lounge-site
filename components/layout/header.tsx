'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingBag, User, ChevronDown, Package, LogOut, Calendar, Settings } from 'lucide-react';
import { SiteLogo } from '@/components/layout/site-logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/cart-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logoutUser } from '@/lib/actions/auth-user';
import { ThemeToggle } from '@/components/theme-toggle';
import type { BrandingConfig } from '@/lib/server-data';

const DEFAULT_LIGHT_SRC = '/uploads/1782418815754-6p2rttowpm3.png';

const navigation = [
  { name: 'Acasă', href: '/' },
  { name: 'Restaurant', href: '/restaurant' },
  { name: 'Meniu', href: '/meniu' },
  { name: 'Rezervări', href: '/rezervari' },
  { name: 'Cabana Rivers', href: '/cabana' },
  { name: 'Noutăți', href: '/noutati' },
  { name: 'Contact', href: '/contact' },
  { name: 'Suport', href: '/suport' },
];

interface HeaderProps {
  userName?: string;
  orderCount?: number;
  branding?: BrandingConfig;
  isVerified?: boolean;
  userAvatar?: string;
  unreadNotificationsCount?: number;
}

export function Header({ userName, orderCount, branding, isVerified, userAvatar, unreadNotificationsCount }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <SiteLogo
            lightSrc={branding?.logoLight ?? DEFAULT_LIGHT_SRC}
            darkSrc={branding?.logoDark || null}
            width={branding?.logoWidth ?? 140}
            height={branding?.logoHeight ?? 44}
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:gap-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <Link href="/meniu" className="hidden sm:block relative">
            <Button variant="outline" size="sm" className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden md:inline">Coș</span>
              {totalItems > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </Link>

          <ThemeToggle className="text-muted-foreground hover:text-foreground" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 relative">
                {userName ? (
                  userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #C9A84C', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#C9A84C', color: '#0F0F0F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10, flexShrink: 0 }}>
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="hidden md:inline">
                  {userName ? userName.split(' ')[0] : 'Cont'}
                </span>
                {isVerified && userName && (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="hidden md:block shrink-0">
                    <circle cx="8" cy="8" r="8" fill="#3B82F6"/>
                    <path d="M5 8L7 10L11 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                <ChevronDown className="h-3 w-3" />
                {unreadNotificationsCount !== undefined && unreadNotificationsCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 3, right: 3,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#3B82F6', border: '2px solid var(--background)',
                  }} />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {userName ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/cont" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contul Meu
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/cont/comenzi" className="flex items-center gap-2">
                      <Package className="h-4 w-4" style={{ color: '#9A9490' }} />
                      Comenzile mele
                      {orderCount !== undefined && orderCount > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">{orderCount}</span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/cont/rezervari" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" style={{ color: '#9A9490' }} />
                      Rezervările mele
                      {unreadNotificationsCount !== undefined && unreadNotificationsCount > 0 && (
                        <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                          {unreadNotificationsCount}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/cont/setari" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" style={{ color: '#9A9490' }} />
                      Setări cont
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={logoutUser} className="w-full">
                      <button
                        type="submit"
                        className="flex items-center gap-2 w-full text-sm text-destructive hover:text-destructive"
                      >
                        <LogOut className="h-4 w-4" style={{ color: '#9A9490' }} />
                        Deconectare
                      </button>
                    </form>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/cont/autentificare">Autentificare</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/cont/inregistrare">Înregistrare</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/cont/beneficii" className="flex items-center gap-2">
                      🎁 Beneficii membri
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/meniu">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Comandă acum
            </Button>
          </Link>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background border-b border-border">
          <div className="space-y-1 px-4 pb-4 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
