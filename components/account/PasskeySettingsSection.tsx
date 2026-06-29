'use client';

import { useState, useEffect, useCallback } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/browser';
import { toast } from 'sonner';

interface Credential {
  id: string;
  credentialId: string;
  deviceName: string | null;
  deviceType: string | null;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export function PasskeySettingsSection() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCredentials = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/webauthn/credentials');
      if (res.ok) setCredentials(await res.json() as Credential[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        if (!window.PublicKeyCredential) { setSupported(false); setLoading(false); return; }
        const avail = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setSupported(avail);
      } catch { setSupported(false); }
      await fetchCredentials();
    }
    init();
  }, [fetchCredentials]);

  async function handleRegister() {
    setRegistering(true);
    try {
      const optRes = await fetch('/api/auth/webauthn/register/options');
      if (!optRes.ok) { toast.error('Eroare la configurare.'); return; }
      const options = await optRes.json() as PublicKeyCredentialCreationOptionsJSON;

      const registrationResponse = await startRegistration({ optionsJSON: options });

      const deviceName = prompt('Cum vrei să numești acest dispozitiv?\n(ex: iPhone 15, MacBook Pro)') ?? 'Dispozitivul meu';

      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationResponse, deviceName }),
      });
      const data = await verifyRes.json() as { ok?: boolean; error?: string };

      if (verifyRes.ok && data.ok) {
        toast.success('Face ID activat cu succes! Data viitoare te poți loga fără parolă.');
        await fetchCredentials();
      } else {
        toast.error(data.error ?? 'Configurare eșuată.');
      }
    } catch (err: unknown) {
      const errName = err instanceof Error ? err.name : '';
      if (errName === 'NotAllowedError') {
        toast.error('Configurare anulată.');
      } else {
        toast.error('Configurare eșuată. Încearcă din nou.');
      }
    } finally {
      setRegistering(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Elimini „${name || 'dispozitivul'}" din metode de autentificare?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/auth/webauthn/credentials/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Dispozitiv eliminat.');
        setCredentials((prev) => prev.filter((c) => c.id !== id));
      } else {
        toast.error('Eroare la ștergere.');
      }
    } finally {
      setDeletingId(null);
    }
  }

  function fmtDate(iso: string | null) {
    if (!iso) return 'Niciodată';
    return new Date(iso).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const inputStyle: React.CSSProperties = {
    background: '#1A1A1A',
    border: '1px solid #2E2E2E',
    borderRadius: 12,
    padding: '22px 24px',
  };

  return (
    <div style={inputStyle}>
      <h3 style={{ color: '#F0EDE6', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
        🔐 Securitate &amp; Autentificare
      </h3>
      <p style={{ color: '#9A9490', fontSize: 13, marginBottom: 18 }}>
        Gestionează metodele de autentificare fără parolă pentru acest cont.
      </p>

      {/* Always-present: email + password */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#0F0F0F', border: '1px solid #2E2E2E', borderRadius: 8,
        padding: '12px 14px', marginBottom: 10,
      }}>
        <span>✅</span>
        <span style={{ color: '#F0EDE6', fontSize: 14 }}>Email + Parolă</span>
        <span style={{ color: '#9A9490', fontSize: 12, marginLeft: 'auto' }}>Implicit</span>
      </div>

      {/* Registered passkeys */}
      {!loading && credentials.map((cred) => (
        <div
          key={cred.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            background: '#0F0F0F', border: '1px solid #2E2E2E', borderRadius: 8,
            padding: '12px 14px', marginBottom: 10,
          }}
        >
          <span>{cred.deviceType === 'platform' ? '📱' : '🔑'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#F0EDE6', fontSize: 14, margin: 0 }}>
              {cred.deviceName ?? 'Dispozitiv'}
            </p>
            <p style={{ color: '#9A9490', fontSize: 11, margin: 0 }}>
              Adăugat: {fmtDate(cred.createdAt)}
              {cred.lastUsedAt && ` · Ultima folosire: ${fmtDate(cred.lastUsedAt)}`}
            </p>
          </div>
          <button
            onClick={() => handleDelete(cred.id, cred.deviceName ?? '')}
            disabled={deletingId === cred.id}
            style={{
              background: 'transparent', color: '#F87171', border: '1px solid #F8717144',
              borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12,
              opacity: deletingId === cred.id ? 0.5 : 1,
            }}
          >
            {deletingId === cred.id ? 'Se șterge...' : 'Elimină'}
          </button>
        </div>
      ))}

      {/* Not supported */}
      {supported === false && (
        <p style={{ color: '#9A9490', fontSize: 13, fontStyle: 'italic', marginBottom: 14 }}>
          Face ID / Touch ID nu este suportat de browserul sau dispozitivul tău curent.
          Funcția este disponibilă pe Chrome, Safari și Edge moderne.
        </p>
      )}

      {/* Add new passkey */}
      {supported !== false && (
        <button
          onClick={handleRegister}
          disabled={registering}
          style={{
            background: 'transparent', color: '#C9A84C', border: '1px solid #C9A84C44',
            borderRadius: 8, padding: '10px 18px', cursor: registering ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 600, opacity: registering ? 0.6 : 1,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span>+</span>
          {registering ? 'Se configurează Face ID...' : 'Adaugă Face ID / Touch ID pe acest dispozitiv'}
        </button>
      )}
    </div>
  );
}
