'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, UserPlus, LogOut, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createUser } from '@/lib/actions/users';
import { loginUser, logoutUser } from '@/lib/actions/auth-user';
import { OrderHistoryClient } from '@/components/account/order-history-client';
import type { Order } from '@/lib/server-data';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'client' | 'admin';
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  isActive: boolean;
  adminNote: string;
  lastLoginAt: string;
  lastOrderAt?: string;
  isVerified?: boolean;
  verifiedAt?: string;
  avatar?: string;
  birthday?: string;
};

// ── Schemas ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Parola trebuie să aibă cel puțin 6 caractere'),
});

const registerSchema = loginSchema
  .extend({
    name: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere'),
    phone: z.string().min(10, 'Număr de telefon invalid'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Parolele nu coincid',
    path: ['confirmPassword'],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

// ── Login form ────────────────────────────────────────────────────────────────

export function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    const result = await loginUser(data.email, data.password);
    if (result.success) {
      toast.success('Autentificare reușită!');
      router.push('/cont');
      router.refresh();
    } else {
      setError('password', { message: result.error ?? 'Eroare la autentificare.' });
    }
  };

  return (
    <Card className="max-w-md mx-auto border-border">
      <CardHeader className="text-center">
        <CardTitle className="font-serif text-2xl">Autentificare</CardTitle>
        <p className="text-sm text-muted-foreground">Accesează contul tău River&apos;s Lounge</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="email@exemplu.ro" />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Parolă</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && (
              <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <LogIn className="h-4 w-4" />
            {isSubmitting ? 'Se autentifică...' : 'Autentificare'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Nu ai cont?{' '}
          <Link href="/cont/inregistrare" className="text-primary hover:underline">
            Înregistrează-te
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

// ── Register form ─────────────────────────────────────────────────────────────

export function RegisterForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    const result = await createUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
    });
    if (result.success) {
      toast.success('Cont creat cu succes!');
      router.push('/cont/autentificare');
    } else {
      toast.error(result.error ?? 'Eroare la crearea contului.');
    }
  };

  return (
    <Card className="max-w-md mx-auto border-border">
      <CardHeader className="text-center">
        <CardTitle className="font-serif text-2xl">Înregistrare</CardTitle>
        <p className="text-sm text-muted-foreground">Creează un cont nou</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nume complet</Label>
            <Input id="name" {...register('name')} placeholder="Ion Popescu" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="email@exemplu.ro" />
            {errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" {...register('phone')} placeholder="07xx xxx xxx" />
            {errors.phone && (
              <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Parolă</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && (
              <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirmă parola</Label>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4" />
            {isSubmitting ? 'Se creează contul...' : 'Creează Cont'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Ai deja cont?{' '}
          <Link href="/cont/autentificare" className="text-primary hover:underline">
            Autentifică-te
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

// ── Account dashboard ─────────────────────────────────────────────────────────

interface AccountDashboardProps {
  user: SafeUser | null;
  initialOrders: Order[];
  upcomingReservationsCount: number;
  lastOrderDate: string | null;
  clientCode: string | null;
}

export function AccountDashboard({
  user,
  initialOrders,
  upcomingReservationsCount,
  lastOrderDate,
  clientCode,
}: AccountDashboardProps) {
  if (!user) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 lg:px-8 text-center space-y-4">
          <h2 className="font-serif text-2xl font-bold">Bun venit!</h2>
          <p className="text-muted-foreground">
            Autentifică-te pentru a vedea comenzile tale și a gestiona contul.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Link href="/cont/autentificare">
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
                <LogIn className="h-4 w-4" />
                Autentificare
              </Button>
            </Link>
            <Link href="/cont/inregistrare">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <UserPlus className="h-4 w-4" />
                Creează cont
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const lastOrderLabel = lastOrderDate
    ? new Date(lastOrderDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-4xl px-4 lg:px-8 space-y-10">

        {/* Header row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #C9A84C', flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#C9A84C', color: '#0F0F0F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 30, flexShrink: 0 }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
            <h2 className="font-serif text-2xl font-bold flex items-center gap-2 flex-wrap">
              Bun venit, <span className="text-primary">{user.name}</span>
              {user.isVerified && (
                <span title="Cont verificat de Rivers Lounge" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="8" fill="#3B82F6"/>
                    <path d="M5 8L7 10L11 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </h2>
            {user.isVerified ? (
              <p className="text-sm mt-0.5" style={{ color: '#60A5FA' }}>Cont Verificat</p>
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5">○ Cont neverificat</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
            </div>
          </div>
          <form action={logoutUser}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Deconectare
            </Button>
          </form>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/cont/comenzi">
            <Card className="p-6 border-border hover:border-primary/50 transition-colors h-full cursor-pointer">
              <h3 className="font-serif font-semibold mb-1">📦 Comenzile Mele</h3>
              <p className="text-sm text-muted-foreground">
                {initialOrders.length > 0
                  ? `${initialOrders.length} comenzi plasate`
                  : 'Nicio comandă încă'}
              </p>
              {lastOrderLabel && (
                <p className="text-xs text-muted-foreground mt-1">Ultima: {lastOrderLabel}</p>
              )}
            </Card>
          </Link>
          <Link href="/cont/rezervari">
            <Card className="p-6 border-border hover:border-primary/50 transition-colors h-full cursor-pointer">
              <h3 className="font-serif font-semibold mb-1">📅 Rezervările Mele</h3>
              <p className="text-sm text-muted-foreground">
                {upcomingReservationsCount > 0
                  ? `${upcomingReservationsCount} rezervări viitoare`
                  : 'Nicio rezervare'}
              </p>
            </Card>
          </Link>
          <Link href="/cont/setari">
            <Card className="p-6 border-border hover:border-primary/50 transition-colors h-full cursor-pointer">
              <h3 className="font-serif font-semibold mb-1">⚙️ Setări Cont</h3>
              <p className="text-sm text-muted-foreground">Actualizează datele tale personale</p>
              {clientCode && (
                <p className="text-xs text-primary mt-1 font-mono font-bold">{clientCode}</p>
              )}
            </Card>
          </Link>
        </div>

        {/* Client code banner */}
        {clientCode && (
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-foreground">🎁 Codul tău de client</p>
              <p className="text-xs text-muted-foreground mt-0.5">Folosește-l pentru promoții exclusive</p>
            </div>
            <span className="font-mono text-2xl font-bold text-primary tracking-widest">
              {clientCode}
            </span>
          </div>
        )}

        {/* Order history */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-xl font-semibold">Istoricul comenzilor tale</h3>
            {initialOrders.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
                {initialOrders.length}
              </span>
            )}
          </div>
          <OrderHistoryClient initialOrders={initialOrders} />
        </div>

      </div>
    </section>
  );
}

