'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const SUBJECTS = [
  'Problemă cu o comandă',
  'Problemă cu o rezervare',
  'Program de fidelizare',
  'Cont și date personale',
  'Plăți și rambursări',
  'Altele',
];

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  gdpr: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  gdpr?: string;
}

export function SupportContactForm() {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    gdpr: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Numele este obligatoriu.';
    if (!form.email.trim()) e.email = 'Emailul este obligatoriu.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Adresă de email invalidă.';
    if (!form.subject) e.subject = 'Selectează un subiect.';
    if (!form.message.trim()) e.message = 'Mesajul este obligatoriu.';
    else if (form.message.trim().length < 20) e.message = 'Mesajul trebuie să aibă cel puțin 20 de caractere.';
    if (!form.gdpr) e.gdpr = 'Trebuie să accepți politica de confidențialitate.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus('loading');
    try {
      const res = await fetch('/api/suport/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          subject: form.subject,
          message: form.message.trim(),
        }),
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

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Mesaj trimis cu succes!</h3>
        <p className="text-muted-foreground max-w-sm">
          Mesajul tău a fost trimis! Te contactăm în maxim 24 de ore.
        </p>
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => { setStatus('idle'); setForm({ name: '', email: '', phone: '', subject: '', message: '', gdpr: false }); }}
        >
          Trimite un alt mesaj
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="support-name" className="text-sm text-muted-foreground">
            Nume complet *
          </Label>
          <Input
            id="support-name"
            placeholder="Ion Popescu"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className={errors.name ? 'border-red-400 focus-visible:ring-red-400' : ''}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="support-email" className="text-sm text-muted-foreground">
            Email *
          </Label>
          <Input
            id="support-email"
            type="email"
            placeholder="ion@exemplu.ro"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className={errors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="support-phone" className="text-sm text-muted-foreground">
            Număr de telefon (opțional)
          </Label>
          <Input
            id="support-phone"
            type="tel"
            placeholder="07xx xxx xxx"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="support-subject" className="text-sm text-muted-foreground">
            Subiect *
          </Label>
          <select
            id="support-subject"
            value={form.subject}
            onChange={(e) => update('subject', e.target.value)}
            className={`w-full h-9 rounded-md border bg-background px-3 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring ${
              errors.subject ? 'border-red-400 focus:ring-red-400' : 'border-input'
            }`}
          >
            <option value="">Selectează un subiect...</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-message" className="text-sm text-muted-foreground">
          Mesaj * <span className="ml-1 text-muted-foreground/60">(min. 20 caractere)</span>
        </Label>
        <Textarea
          id="support-message"
          rows={5}
          placeholder="Descrie problema sau întrebarea ta cât mai detaliat..."
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          className={`resize-none ${errors.message ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
        />
        <div className="flex justify-between">
          {errors.message
            ? <p className="text-xs text-red-500">{errors.message}</p>
            : <span />}
          <span className={`text-xs ${form.message.length < 20 ? 'text-muted-foreground/50' : 'text-green-500'}`}>
            {form.message.length} / 20+
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={form.gdpr}
              onChange={(e) => update('gdpr', e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                form.gdpr
                  ? 'bg-primary border-primary'
                  : errors.gdpr
                    ? 'border-red-400'
                    : 'border-input group-hover:border-primary/50'
              }`}
            >
              {form.gdpr && (
                <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-muted-foreground leading-relaxed">
            Am citit și sunt de acord cu{' '}
            <Link href="/confidentialitate" className="text-primary hover:underline underline-offset-2" target="_blank">
              Politica de Confidențialitate
            </Link>
            . *
          </span>
        </label>
        {errors.gdpr && <p className="text-xs text-red-500 pl-7">{errors.gdpr}</p>}
      </div>

      {status === 'error' && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500">
          A apărut o eroare. Te rugăm să ne contactezi direct la{' '}
          <a href="tel:0725635020" className="underline font-medium">0725 635 020</a>.
        </div>
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
            Trimite mesajul
          </>
        )}
      </Button>
    </form>
  );
}
