'use client';

import { useState, useEffect } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';

type SupportState = 'checking' | 'supported' | 'unsupported';
type Status = 'idle' | 'loading' | 'success' | 'error' | 'no_credentials' | 'cancelled';

function parseWebAuthnError(err: unknown): { userMsg: string; debugInfo: string } {
  const name = err instanceof Error ? err.name : 'UnknownError';
  const msg  = err instanceof Error ? err.message : String(err);
  const debug = `${name}: ${msg}`;

  switch (name) {
    case 'NotAllowedError':
      return {
        userMsg: 'Autentificare anulată sau refuzată. Apasă butonul și completează cu Face ID.',
        debugInfo: debug,
      };
    case 'SecurityError':
      return {
        userMsg: 'Eroare de securitate — domeniu neconfigurat corect. Contactează suportul.',
        debugInfo: debug,
      };
    case 'AbortError':
      return {
        userMsg: 'Operațiunea a fost întreruptă. Încearcă din nou.',
        debugInfo: debug,
      };
    default:
      return {
        userMsg: `Eroare (${name}). Încearcă cu parola sau contactează suportul.`,
        debugInfo: debug,
      };
  }
}

export function PasskeyLoginSection() {
  const router = useRouter();
  const [support, setSupport] = useState<SupportState>('checking');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [debugMsg, setDebugMsg] = useState('');

  useEffect(() => {
    async function checkSupport() {
      if (!window.PublicKeyCredential) {
        console.log('[WebAuthn] PublicKeyCredential API not available in this browser.');
        setSupport('unsupported');
        return;
      }
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        console.log('[WebAuthn] isUserVerifyingPlatformAuthenticatorAvailable:', available);
        setSupport(available ? 'supported' : 'unsupported');
      } catch (err) {
        console.error('[WebAuthn] Support check threw:', err);
        setSupport('unsupported');
      }
    }
    checkSupport();
  }, []);

  if (support === 'checking' || support === 'unsupported') return null;

  async function handleFaceID() {
    if (!email.trim()) { setErrorMsg('Introdu adresa de email mai întâi.'); return; }
    setStatus('loading');
    setErrorMsg('');
    setDebugMsg('');

    try {
      // 1. Get authentication options from server
      const optRes = await fetch('/api/auth/webauthn/authenticate/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const optData = await optRes.json() as PublicKeyCredentialRequestOptionsJSON & { error?: string };

      if (!optRes.ok || optData.error) {
        console.warn('[WebAuthn] authenticate/options returned error:', optData.error, 'status:', optRes.status);
        setStatus('no_credentials');
        setErrorMsg(optData.error ?? 'Nu ai Face ID înregistrat pe acest cont.');
        return;
      }

      console.log('[WebAuthn] Got authentication options, rpId:', optData.rpId ?? '(not set)', 'timeout:', optData.timeout);

      // 2. Trigger Face ID / Touch ID / Windows Hello
      const authResponse = await startAuthentication({ optionsJSON: optData });
      console.log('[WebAuthn] startAuthentication succeeded, credential id prefix:', authResponse.id.slice(0, 12));

      // 3. Verify with server
      const verifyRes = await fetch('/api/auth/webauthn/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), authenticationResponse: authResponse }),
      });
      const verifyData = await verifyRes.json() as { ok?: boolean; error?: string };

      if (verifyRes.ok && verifyData.ok) {
        setStatus('success');
        router.push('/cont');
        router.refresh();
      } else {
        console.warn('[WebAuthn] verify returned error:', verifyData.error, 'status:', verifyRes.status);
        setStatus('error');
        setErrorMsg(verifyData.error ?? 'Autentificare eșuată.');
      }
    } catch (err: unknown) {
      const { userMsg, debugInfo } = parseWebAuthnError(err);
      console.error('[WebAuthn] Authentication flow error:', debugInfo, err);
      const name = err instanceof Error ? err.name : '';
      setStatus(name === 'NotAllowedError' ? 'cancelled' : 'error');
      setErrorMsg(userMsg);
      setDebugMsg(debugInfo);
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🔐</span>
        <span className="text-sm font-semibold text-foreground">Intră cu Face ID / Touch ID</span>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="passkey-email" className="text-sm text-muted-foreground block mb-1">
            Adresă de email
          </label>
          <input
            id="passkey-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus('idle'); setErrorMsg(''); setDebugMsg(''); }}
            placeholder="email@exemplu.ro"
            className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {errorMsg && (
          <div>
            <p className="text-xs text-destructive">{errorMsg}</p>
            {debugMsg && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono opacity-70">{debugMsg}</p>
            )}
          </div>
        )}

        {status === 'no_credentials' && (
          <p className="text-xs text-muted-foreground">
            Loghează-te cu parola și activează Face ID din <strong>Setări cont → Securitate</strong>.
          </p>
        )}

        <button
          type="button"
          disabled={status === 'loading' || status === 'success'}
          onClick={handleFaceID}
          className="w-full py-2.5 rounded-md text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#C9A84C', color: '#0F0F0F' }}
        >
          {status === 'loading' ? 'Se verifică identitatea...' :
           status === 'success' ? '✓ Autentificat!' :
           'Continuă cu Face ID'}
        </button>
      </div>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground">sau</span>
        </div>
      </div>
    </div>
  );
}
