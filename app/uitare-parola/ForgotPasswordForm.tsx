'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [emailError, setEmailError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) { setEmailError('Introduceți adresa de email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Adresă de email invalidă.');
      return;
    }
    setEmailError('');
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
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
        {status === 'success' ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Email trimis!</h1>
            <p className="text-muted-foreground leading-relaxed">
              Am trimis un email la adresa introdusă. Verifică și folderul{' '}
              <strong className="text-foreground">Spam</strong> dacă nu găsești emailul.
            </p>
            <p className="text-sm text-muted-foreground">
              Linkul de resetare este valabil <strong className="text-foreground">1 oră</strong>.
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => { setStatus('idle'); setEmail(''); }}
            >
              Trimite din nou
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
                Ai uitat parola?
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Introdu adresa de email și îți trimitem un link de resetare.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reset-email" className="text-sm text-muted-foreground">
                  Adresă de email
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="email@exemplu.ro"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  className={emailError ? 'border-red-400 focus-visible:ring-red-400' : ''}
                  autoComplete="email"
                  autoFocus
                />
                {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              </div>

              {status === 'error' && (
                <p className="text-xs text-red-500">
                  A apărut o eroare. Încearcă din nou sau contactează-ne la{' '}
                  <a href="mailto:renetrading@yahoo.com" className="underline">
                    renetrading@yahoo.com
                  </a>.
                </p>
              )}

              <Button
                type="submit"
                disabled={status === 'loading'}
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Se trimite...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Trimite link de resetare
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
