'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Settings } from 'lucide-react';

interface ConsentData {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  status?: string;
  timestamp?: string;
}

export function CookiePreferencesPanel() {
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const readConsent = () => {
      try {
        const raw = localStorage.getItem('rl_cookie_consent');
        setConsent(raw ? JSON.parse(raw) : null);
      } catch {
        setConsent(null);
      }
    };
    readConsent();
    window.addEventListener('consentUpdated', readConsent);
    return () => window.removeEventListener('consentUpdated', readConsent);
  }, []);

  function openPreferences() {
    window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
  }

  if (!mounted) return null;

  const formattedDate = consent?.timestamp
    ? new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(consent.timestamp)
      )
    : null;

  return (
    <div className="rounded-2xl border border-border bg-secondary/50 p-6 space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-lg">🍪</span>
        <h2 className="text-base font-semibold text-foreground">Preferințele tale de cookie-uri</h2>
      </div>

      {consent ? (
        <>
          <div className="space-y-2.5">
            <StatusRow label="Cookie-uri esențiale" active={true} alwaysActive />
            <StatusRow label="Cookie-uri analiză" active={consent.analytics} />
            <StatusRow label="Cookie-uri marketing" active={consent.marketing} />
          </div>

          {formattedDate && (
            <p className="text-xs text-muted-foreground">
              Ultima actualizare: {formattedDate}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nu ai ales încă preferințele pentru cookie-uri.
        </p>
      )}

      <button
        onClick={openPreferences}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Settings className="h-4 w-4" />
        Modifică preferințele
      </button>
    </div>
  );
}

function StatusRow({
  label,
  active,
  alwaysActive,
}: {
  label: string;
  active: boolean;
  alwaysActive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      {alwaysActive ? (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
          <CheckCircle2 className="h-3.5 w-3.5" /> Mereu active
        </span>
      ) : active ? (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
          <CheckCircle2 className="h-3.5 w-3.5" /> Acceptate
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <XCircle className="h-3.5 w-3.5" /> Refuzate
        </span>
      )}
    </div>
  );
}
