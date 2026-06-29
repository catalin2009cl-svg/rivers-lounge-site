'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, CheckCircle, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ['', 'Slabă', 'Acceptabilă', 'Bună', 'Puternică'];
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

  if (!password) return null;

  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{ background: i <= score ? colors[score] : '#2e2e2e' }}
          />
        ))}
      </div>
      {score > 0 && (
        <p className="text-xs" style={{ color: colors[score] }}>
          {labels[score]}
        </p>
      )}
    </div>
  );
}

type PageState = 'checking' | 'invalid' | 'form' | 'loading' | 'success';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [state, setState] = useState<PageState>('checking');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; server?: string }>({});

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json() as Promise<{ valid: boolean; email?: string }>)
      .then((data) => {
        if (data.valid) {
          setMaskedEmail(data.email ?? '');
          setState('form');
        } else {
          setState('invalid');
        }
      })
      .catch(() => setState('invalid'));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (password.length < 8) errs.password = 'Parola trebuie să aibă cel puțin 8 caractere.';
    if (password !== confirmPassword) errs.confirm = 'Parolele nu coincid.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setState('loading');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) {
        setState('success');
      } else {
        setErrors({ server: data.error ?? 'Eroare internă. Încearcă din nou.' });
        setState('form');
      }
    } catch {
      setErrors({ server: 'Eroare de conexiune. Încearcă din nou.' });
      setState('form');
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Link
        href="/cont/autentificare"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la autentificare
      </Link>

      <div className="rounded-2xl border border-border bg-card p-8">
        {/* Checking */}
        {state === 'checking' && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Se verifică linkul...</p>
          </div>
        )}

        {/* Invalid */}
        {state === 'invalid' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground">Link invalid sau expirat</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Linkul de resetare este invalid sau a expirat. Linkurile sunt valabile doar 1 oră.
            </p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/uitare-parola">Solicită un nou link</Link>
            </Button>
          </div>
        )}

        {/* Success */}
        {state === 'success' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground">Parolă actualizată!</h2>
            <p className="text-muted-foreground text-sm">
              Parola a fost schimbată cu succes! Acum te poți autentifica cu noua parolă.
            </p>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push('/cont/autentificare')}
            >
              Mergi la autentificare
            </Button>
          </div>
        )}

        {/* Form */}
        {(state === 'form' || state === 'loading') && (
          <>
            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h1 className="font-serif text-2xl font-bold text-foreground mb-1">
                Setează o parolă nouă
              </h1>
              {maskedEmail && (
                <p className="text-sm text-muted-foreground">
                  Resetezi parola pentru{' '}
                  <span className="text-foreground font-medium">{maskedEmail}</span>
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-sm text-muted-foreground">
                  Parolă nouă
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minim 8 caractere"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                    className={`pr-10 ${errors.password ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-sm text-muted-foreground">
                  Confirmă parola
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repetă parola nouă"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirm: undefined })); }}
                    className={`pr-10 ${errors.confirm ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirm && <p className="text-xs text-red-500">{errors.confirm}</p>}
              </div>

              {errors.server && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500">
                  {errors.server}
                </div>
              )}

              <Button
                type="submit"
                disabled={state === 'loading'}
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
              >
                {state === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Se salvează...
                  </>
                ) : (
                  'Salvează parola nouă'
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
