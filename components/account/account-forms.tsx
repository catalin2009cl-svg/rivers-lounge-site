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
import { WalletWidget } from '@/components/account/wallet-widget';
import type { Order } from '@/lib/server-data';
import type { WalletTransactionSummary } from '@/lib/loyalty/types';

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
  googleId?: string | null;
  facebookId?: string | null;
  avatarUrl?: string | null;
  authProvider?: string | null;
};

// ── OAuth buttons ─────────────────────────────────────────────────────────────

function OAuthButtons({
  mode,
  hasGoogle,
  hasFacebook,
}: {
  mode: 'login' | 'register';
  hasGoogle: boolean;
  hasFacebook: boolean;
}) {
  if (!hasGoogle && !hasFacebook) return null;
  const verb = mode === 'login' ? 'Continuă cu' : 'Înregistrare cu';
  return (
    <div className="space-y-2 mb-4">
      {hasGoogle && (
        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-3 w-full py-2.5 rounded-md border text-sm font-semibold transition-colors hover:bg-muted/50"
          style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'inherit' }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {verb} Google
        </a>
      )}
      {hasFacebook && (
        <a
          href="/api/auth/facebook"
          className="flex items-center justify-center gap-3 w-full py-2.5 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#1877F2' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          {verb} Facebook
        </a>
      )}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 text-xs text-muted-foreground" style={{ background: 'hsl(var(--card))' }}>
            sau cu email
          </span>
        </div>
      </div>
    </div>
  );
}

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
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Parolele nu coincid',
    path: ['confirmPassword'],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

// ── Login form ────────────────────────────────────────────────────────────────

export function LoginForm({
  hasGoogle = false,
  hasFacebook = false,
}: {
  hasGoogle?: boolean;
  hasFacebook?: boolean;
}) {
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
        <OAuthButtons mode="login" hasGoogle={hasGoogle} hasFacebook={hasFacebook} />
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
          <p className="text-center">
            <Link
              href="/uitare-parola"
              className="text-sm text-primary hover:underline underline-offset-2"
            >
              Ai uitat parola?
            </Link>
          </p>
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

export function RegisterForm({
  defaultReferralCode = '',
  hasGoogle = false,
  hasFacebook = false,
}: {
  defaultReferralCode?: string;
  hasGoogle?: boolean;
  hasFacebook?: boolean;
}) {
  const router = useRouter();
  const [referralValidState, setReferralValidState] = useState<
    'idle' | 'checking' | 'valid' | 'invalid'
  >('idle');
  const [referrerName, setReferrerName] = useState('');
  const [referralCodeValue, setReferralCodeValue] = useState(defaultReferralCode);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), defaultValues: { referralCode: defaultReferralCode } });

  // Auto-validate referral code from URL param
  useState(() => {
    if (defaultReferralCode) {
      validateReferralCode(defaultReferralCode);
    }
  });

  async function validateReferralCode(code: string) {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setReferralValidState('idle'); return; }
    if (!/^RL-[A-Z0-9]{4,8}$/.test(trimmed)) { setReferralValidState('invalid'); return; }
    setReferralValidState('checking');
    try {
      const res = await fetch('/api/loyalty/validate-referral-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json() as { valid: boolean; referrerName?: string };
      if (data.valid) {
        setReferralValidState('valid');
        setReferrerName(data.referrerName ?? '');
      } else {
        setReferralValidState('invalid');
      }
    } catch {
      setReferralValidState('idle');
    }
  }

  const onSubmit = async (data: RegisterForm) => {
    const result = await createUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      referralCode: data.referralCode?.trim() || undefined,
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
        <OAuthButtons mode="register" hasGoogle={hasGoogle} hasFacebook={hasFacebook} />
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

          {/* Referral code (optional) */}
          <div style={{ borderTop: '1px solid rgba(201,168,76,0.15)', paddingTop: 16 }}>
            <Label htmlFor="referralCode" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span>🎁</span>
              <span>Cod de invitație</span>
              <span className="text-xs text-muted-foreground font-normal">(opțional)</span>
            </Label>
            <Input
              id="referralCode"
              {...register('referralCode')}
              placeholder="Ex: RL-XXXX"
              value={referralCodeValue}
              style={{
                borderColor:
                  referralValidState === 'valid'
                    ? '#16a34a'
                    : referralValidState === 'invalid'
                    ? '#dc2626'
                    : undefined,
              }}
              onChange={(e) => {
                const v = e.target.value;
                setReferralCodeValue(v);
                setValue('referralCode', v);
                if (v.trim().length === 0) {
                  setReferralValidState('idle');
                  return;
                }
                // Debounce: validate after 600ms of no typing
                const t = setTimeout(() => validateReferralCode(v), 600);
                return () => clearTimeout(t);
              }}
            />
            {referralValidState === 'valid' && (
              <p className="text-xs mt-1" style={{ color: '#16a34a' }}>
                ✅ Cod valid! Vei primi {referrerName ? `de la ${referrerName} — ` : ''}30 RON credit cadou + acces direct la Nivel 2.
              </p>
            )}
            {referralValidState === 'invalid' && (
              <p className="text-xs text-destructive mt-1">❌ Cod de invitație invalid.</p>
            )}
            {referralValidState === 'checking' && (
              <p className="text-xs text-muted-foreground mt-1">Se verifică codul...</p>
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

interface LoyaltyWidgetData {
  currentLevel: number;
  currentLevelName: string;
  totalCompletedOrders: number;
  ordersRequired: number;
  hasActiveReward: boolean;
  activeRewardValue?: number;
  walletBalance?: number;
  walletExpiresAt?: string | null;
  recentWalletTransactions?: WalletTransactionSummary[];
  priorityDelivery?: boolean;
  level3CashbackBoostLeft?: number;
  totalReferrals?: number;
  referralCashbackEarned?: number;
  referralCode?: string | null;
  upgradeReferralsRequired?: number;
}

interface AccountDashboardProps {
  user: SafeUser | null;
  initialOrders: Order[];
  upcomingReservationsCount: number;
  lastOrderDate: string | null;
  clientCode: string | null;
  loyaltyWidget?: LoyaltyWidgetData | null;
}

export function AccountDashboard({
  user,
  initialOrders,
  upcomingReservationsCount,
  lastOrderDate,
  clientCode,
  loyaltyWidget,
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

        {/* Wallet widget */}
        {loyaltyWidget && (
          <WalletWidget
            walletBalance={loyaltyWidget.walletBalance ?? 0}
            walletExpiresAt={loyaltyWidget.walletExpiresAt ?? null}
            recentWalletTransactions={loyaltyWidget.recentWalletTransactions ?? []}
          />
        )}

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

        {/* Loyalty widget */}
        {loyaltyWidget && (
          <Link href="/cont/fidelizare" className="block group">
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 hover:border-primary/50 hover:bg-primary/10 transition-all">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🏆</span>
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-wide">
                      Nivel {loyaltyWidget.currentLevel}
                    </span>
                    <span className="text-xs text-muted-foreground mx-1.5">—</span>
                    <span className="text-xs font-semibold text-foreground">
                      {loyaltyWidget.currentLevelName}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-primary font-semibold group-hover:underline underline-offset-2 shrink-0">
                  Vezi detalii →
                </span>
              </div>

              {/* Progress bar */}
              <div
                className="rounded-full overflow-hidden mb-2"
                style={{ height: 6, background: 'rgba(201,168,76,0.15)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (loyaltyWidget.totalCompletedOrders / loyaltyWidget.ordersRequired) * 100)}%`,
                    background: 'linear-gradient(90deg, #C9A84C, #F5D98B)',
                  }}
                />
              </div>

              {/* Status text */}
              <p className="text-xs text-muted-foreground">
                {loyaltyWidget.hasActiveReward ? (
                  <span className="font-semibold" style={{ color: '#4ade80' }}>
                    🎁 Ai o recompensă activă — comandă gratuită
                    {loyaltyWidget.activeRewardValue ? ` (${loyaltyWidget.activeRewardValue.toFixed(0)} RON)` : ''}!
                  </span>
                ) : (
                  <>
                    <strong className="text-foreground">{loyaltyWidget.totalCompletedOrders}</strong>
                    {' / '}
                    <strong className="text-foreground">{loyaltyWidget.ordersRequired}</strong>
                    {' comenzi · mai ai '}
                    <strong className="text-foreground">
                      {Math.max(0, loyaltyWidget.ordersRequired - loyaltyWidget.totalCompletedOrders)}
                    </strong>
                    {' până la recompensă'}
                  </>
                )}
              </p>

              {/* Priority delivery badge (Level 3+) */}
              {loyaltyWidget.priorityDelivery && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: '#FACC15' }}>
                  ⚡ Livrare Prioritară activă
                  {(loyaltyWidget.level3CashbackBoostLeft ?? 0) > 0 && (
                    <span style={{ color: '#9A9490', fontWeight: 400 }}>
                      {' · '}boost 5% ({loyaltyWidget.level3CashbackBoostLeft} comenzi)
                    </span>
                  )}
                </p>
              )}

              {/* Level 4 Silver badge */}
              {loyaltyWidget.currentLevel >= 4 && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: '#a78bfa' }}>
                  ⭐ Silver — {loyaltyWidget.totalReferrals ?? 0} referrali activi
                  {(loyaltyWidget.referralCashbackEarned ?? 0) > 0 && (
                    <span style={{ color: '#9A9490', fontWeight: 400 }}>
                      {' · '}{(loyaltyWidget.referralCashbackEarned ?? 0).toFixed(2)} RON câștigat din referrali
                    </span>
                  )}
                </p>
              )}

              {/* Level 3 → Level 4 progress */}
              {loyaltyWidget.currentLevel === 3 && (loyaltyWidget.upgradeReferralsRequired ?? 2) > 0 && (
                <p className="text-xs mt-1.5" style={{ color: '#a78bfa' }}>
                  ⭐ {loyaltyWidget.totalReferrals ?? 0}/{loyaltyWidget.upgradeReferralsRequired ?? 2} referrali pentru Silver
                </p>
              )}

              {/* Referral code for all users */}
              {loyaltyWidget.referralCode && (
                <p className="text-xs mt-1.5" style={{ color: '#9A9490' }}>
                  🤝 Cod invitație:{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#C9A84C' }}>
                    {loyaltyWidget.referralCode}
                  </span>
                </p>
              )}

              {/* Wallet balance (Level 2+) */}
              {(loyaltyWidget.walletBalance ?? 0) > 0 && (
                <p className="text-xs mt-1.5">
                  {'💳 Portofel: '}
                  <strong className="text-primary">{loyaltyWidget.walletBalance!.toFixed(2)} RON</strong>
                  {loyaltyWidget.walletExpiresAt && (
                    <span className="text-muted-foreground">
                      {' · expiră '}
                      {new Date(loyaltyWidget.walletExpiresAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </p>
              )}
            </div>
          </Link>
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

