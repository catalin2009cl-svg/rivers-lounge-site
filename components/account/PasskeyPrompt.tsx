'use client';

import { useState, useEffect } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/browser';

const DISMISS_KEY = 'rl-webauthn-dismissed';
const SNOOZE_KEY = 'rl-webauthn-snooze';
const SNOOZE_DAYS = 7;

export function PasskeyPrompt() {
  const [show, setShow] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [done, setDone] = useState(false);
  const [regError, setRegError] = useState('');

  useEffect(() => {
    async function check() {
      // Check if dismissed permanently
      if (localStorage.getItem(DISMISS_KEY)) return;

      // Check if snoozed
      const snooze = localStorage.getItem(SNOOZE_KEY);
      if (snooze && Date.now() < Number(snooze)) return;

      // Check platform authenticator support
      try {
        if (!window.PublicKeyCredential) return;
        const avail = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!avail) return;
      } catch { return; }

      // Check if user already has credentials
      const res = await fetch('/api/auth/webauthn/credentials');
      if (!res.ok) return;
      const creds = await res.json() as unknown[];
      if (creds.length > 0) return;

      setShow(true);
    }
    check();
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  }

  function snooze() {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000));
    setShow(false);
  }

  async function handleActivate() {
    setRegistering(true);
    setRegError('');
    try {
      const optRes = await fetch('/api/auth/webauthn/register/options');
      if (!optRes.ok) {
        const body = await optRes.json().catch(() => ({})) as { error?: string };
        const msg = body.error ?? `Server error ${optRes.status}`;
        console.error('[WebAuthn] register/options failed:', msg);
        setRegError(msg);
        return;
      }
      const options = await optRes.json() as PublicKeyCredentialCreationOptionsJSON;
      console.log('[WebAuthn] Got registration options, rp.id:', options.rp?.id, 'timeout:', options.timeout);

      const registrationResponse = await startRegistration({ optionsJSON: options });
      console.log('[WebAuthn] startRegistration succeeded');

      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationResponse, deviceName: 'Dispozitivul meu' }),
      });
      const data = await verifyRes.json() as { ok?: boolean; error?: string };

      if (verifyRes.ok && data.ok) {
        setDone(true);
        setTimeout(() => setShow(false), 2500);
      } else {
        console.error('[WebAuthn] register/verify failed:', data.error);
        setRegError(data.error ?? 'Verificare eșuată.');
      }
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : 'UnknownError';
      const msg  = err instanceof Error ? err.message : String(err);
      console.error('[WebAuthn] Registration error:', name, msg, err);
      if (name !== 'NotAllowedError') {
        setRegError(`${name}: ${msg}`);
      }
    } finally {
      setRegistering(false);
    }
  }

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        background: '#1A1A1A', border: '1px solid rgba(201,168,76,0.4)',
        borderRadius: 16, padding: '20px 22px', maxWidth: 360, width: 'calc(100vw - 48px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {done ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 28, margin: '0 0 8px' }}>✅</p>
          <p style={{ color: '#4ADE80', fontSize: 14, fontWeight: 600 }}>
            Face ID activat cu succes!
          </p>
          <p style={{ color: '#9A9490', fontSize: 13, marginTop: 4 }}>
            Data viitoare te poți loga fără parolă.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 26, flexShrink: 0 }}>🔐</span>
            <div>
              <p style={{ color: '#F0EDE6', fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>
                Activează Face ID pentru login rapid
              </p>
              <p style={{ color: '#9A9490', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                Data viitoare te poți loga cu Face ID sau Touch ID, fără să mai introduci parola.
              </p>
            </div>
          </div>

          {regError && (
            <p style={{ color: '#F87171', fontSize: 12, marginBottom: 10, fontFamily: 'monospace', wordBreak: 'break-word' }}>
              {regError}
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={handleActivate}
              disabled={registering}
              style={{
                background: '#C9A84C', color: '#0F0F0F', fontWeight: 700,
                border: 'none', borderRadius: 8, padding: '9px 18px',
                cursor: registering ? 'not-allowed' : 'pointer', fontSize: 13,
                opacity: registering ? 0.7 : 1,
              }}
            >
              {registering ? 'Se configurează...' : 'Activează acum'}
            </button>
            <button
              onClick={snooze}
              style={{
                background: 'transparent', color: '#9A9490', border: '1px solid #2E2E2E',
                borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontSize: 13,
              }}
            >
              Nu acum
            </button>
            <button
              onClick={dismiss}
              style={{
                background: 'transparent', color: '#666', border: 'none',
                padding: '9px 0', cursor: 'pointer', fontSize: 12,
              }}
            >
              Nu mai afișa
            </button>
          </div>
        </>
      )}
    </div>
  );
}
