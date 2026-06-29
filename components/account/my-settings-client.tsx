'use client';

import { useState, useTransition, useRef } from 'react';
import { toast } from 'sonner';
import { updateMyProfile, changePassword, deleteAccount, uploadAvatar } from '@/lib/actions/users';
import { saveBirthday, saveBirthDate } from '@/lib/actions/birthday';
import type { SafeUser } from '@/components/account/account-forms';

function ForgotPasswordInline({ userEmail }: { userEmail: string }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSend() {
    setSending(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      setSent(true);
    } catch {
      toast.error('Eroare la trimitere. Încearcă din nou.');
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <p style={{ fontSize: 12, color: '#4ADE80' }}>
        ✓ Am trimis un link de resetare la emailul contului tău.
      </p>
    );
  }

  return (
    <div style={{ borderTop: '1px solid #2E2E2E', paddingTop: 12, marginTop: 2 }}>
      <p style={{ fontSize: 12, color: '#9A9490', marginBottom: 8 }}>
        Nu îți știi parola actuală?
      </p>
      <button
        type="button"
        disabled={sending}
        onClick={handleSend}
        style={{
          fontSize: 12, color: '#C9A84C', background: 'transparent', border: 'none',
          padding: 0, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.6 : 1,
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}
      >
        {sending ? 'Se trimite...' : 'Trimite link de resetare pe email'}
      </button>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SavedAddress {
  address: string;
  city: string;
  addressDetails: string;
  count: number;
}

interface Props {
  user: SafeUser;
  clientCode: string;
  savedAddresses: SavedAddress[];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#1A1A1A', border: '1px solid #2E2E2E', borderRadius: 12, padding: '22px 24px' }}>
      <h3 style={{ color: '#F0EDE6', fontSize: 16, fontWeight: 600, marginBottom: 18 }}>{title}</h3>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#0F0F0F', border: '1px solid #2E2E2E', color: '#F0EDE6',
  borderRadius: 8, padding: '10px 14px', fontSize: 14, width: '100%', outline: 'none',
};

const btnGold: React.CSSProperties = {
  background: '#C9A84C', color: '#0F0F0F', fontWeight: 700, border: 'none',
  borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontSize: 14,
};

const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#9A9490', border: '1px solid #2E2E2E',
  borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontSize: 14,
};

// ── Component ─────────────────────────────────────────────────────────────────

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 400;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => { if (blob) resolve(blob); else reject(new Error('Compresie eșuată')); },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => reject(new Error('Imagine invalidă'));
    img.src = objectUrl;
  });
}

export function MySettingsClient({ user, clientCode, savedAddresses }: Props) {

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState(user.avatar ?? '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const blob = await compressImage(file);
      const compressed = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const preview = URL.createObjectURL(blob);
      setAvatarUrl(preview);
      const fd = new FormData();
      fd.append('file', compressed);
      const result = await uploadAvatar(fd);
      URL.revokeObjectURL(preview);
      if ('url' in result) {
        setAvatarUrl(result.url);
        toast.success('Poza de profil a fost actualizată.');
      } else {
        setAvatarUrl(user.avatar ?? '');
        toast.error(result.error);
      }
    } catch {
      setAvatarUrl(user.avatar ?? '');
      toast.error('Eroare la procesarea imaginii.');
    }
    setAvatarUploading(false);
    e.target.value = '';
  }

  // ── Profile form ────────────────────────────────────────────────────────────
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone ?? '');
  const [, startProfileTransition] = useTransition();

  function handleSaveProfile() {
    startProfileTransition(async () => {
      const res = await updateMyProfile({ name: profileName, phone: profilePhone });
      if (res.success) toast.success('Date actualizate cu succes.');
      else toast.error(res.error ?? 'Eroare.');
    });
  }

  // ── Password form ───────────────────────────────────────────────────────────
  const [pwCurrent, setPwCurrent]   = useState('');
  const [pwNew, setPwNew]           = useState('');
  const [pwConfirm, setPwConfirm]   = useState('');
  const [pwError, setPwError]       = useState('');
  const [, startPwTransition] = useTransition();

  function handleChangePassword() {
    setPwError('');
    if (pwNew.length < 8) { setPwError('Parola nouă trebuie să aibă cel puțin 8 caractere.'); return; }
    if (pwNew !== pwConfirm) { setPwError('Parolele noi nu coincid.'); return; }
    startPwTransition(async () => {
      const res = await changePassword(pwCurrent, pwNew);
      if (res.success) {
        toast.success('Parola a fost schimbată.');
        setPwCurrent(''); setPwNew(''); setPwConfirm('');
      } else {
        setPwError(res.error ?? 'Eroare.');
      }
    });
  }

  // ── Notifications (UI only) ─────────────────────────────────────────────────
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifPromos, setNotifPromos] = useState(false);

  // ── Copy code ───────────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(clientCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Birthday ────────────────────────────────────────────────────────────────
  const initialBdayParts = user.birthday?.split('-') ?? [];
  const [bdayMonth, setBdayMonth] = useState(initialBdayParts[0] ?? '');
  const [bdayDay, setBdayDay] = useState(initialBdayParts[1] ?? '');
  const currentYear = new Date().getFullYear();
  const [bdayYear, setBdayYear] = useState('');
  const [, startBdayTransition] = useTransition();

  function handleSaveBirthday() {
    if (!bdayMonth || !bdayDay) {
      toast.error('Selectează luna și ziua nașterii.');
      return;
    }
    startBdayTransition(async () => {
      if (bdayYear) {
        const res = await saveBirthDate(bdayMonth, bdayDay, bdayYear);
        if (res.success) toast.success('Data nașterii a fost salvată.');
        else toast.error(res.error ?? 'Eroare.');
      } else {
        const value = `${bdayMonth.padStart(2, '0')}-${bdayDay.padStart(2, '0')}`;
        const res = await saveBirthday(value);
        if (res.success) toast.success('Data nașterii a fost salvată.');
        else toast.error(res.error ?? 'Eroare.');
      }
    });
  }

  // ── Delete account ─────────────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [, startDeleteTransition] = useTransition();

  function handleDeleteAccount() {
    startDeleteTransition(async () => {
      await deleteAccount();
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>

      {/* 1. Date personale */}
      <SectionCard title="Date personale">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Avatar upload */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
            <div style={{ position: 'relative' }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profileName}
                  style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #C9A84C', display: 'block' }}
                />
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#C9A84C', color: '#0F0F0F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22 }}>
                  {profileName.charAt(0).toUpperCase()}
                </div>
              )}
              {avatarUploading && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12, color: '#fff' }}>...</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <div>
              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
                style={{ ...btnGhost, fontSize: 12, padding: '6px 14px', opacity: avatarUploading ? 0.6 : 1 }}
              >
                📷 Schimbă poza
              </button>
              <p style={{ color: '#4E4E4E', fontSize: 11, marginTop: 4 }}>Format: JPG, PNG — max 2MB</p>
            </div>
          </div>
          <label style={{ color: '#9A9490', fontSize: 13 }}>
            Nume complet
            <input
              style={{ ...inputStyle, marginTop: 4 }}
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Nume complet"
            />
          </label>
          <label style={{ color: '#9A9490', fontSize: 13 }}>
            Email (nemodificabil)
            <input
              style={{ ...inputStyle, marginTop: 4, opacity: 0.5, cursor: 'not-allowed' }}
              value={user.email}
              readOnly
            />
          </label>
          <label style={{ color: '#9A9490', fontSize: 13 }}>
            Telefon
            <input
              style={{ ...inputStyle, marginTop: 4 }}
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              placeholder="07xx xxx xxx"
            />
          </label>
          <button style={{ ...btnGold, alignSelf: 'flex-start' }} onClick={handleSaveProfile}>
            Salvează modificările
          </button>
        </div>
      </SectionCard>

      {/* 2. Codul tău de client */}
      <div style={{ background: '#1A1A1A', border: '1px solid #C9A84C44', borderRadius: 12, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>🎁</span>
          <h3 style={{ color: '#F0EDE6', fontSize: 16, fontWeight: 600 }}>Codul tău de client</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: '#C9A84C', letterSpacing: 3, fontFamily: 'monospace' }}>
            {clientCode}
          </span>
          <button
            onClick={handleCopy}
            style={{ ...btnGhost, fontSize: 13, padding: '7px 16px', color: copied ? '#4ADE80' : '#9A9490', borderColor: copied ? '#4ADE80' : '#2E2E2E' }}
          >
            {copied ? '✓ Copiat!' : '📋 Copiază codul'}
          </button>
        </div>
        <p style={{ color: '#9A9490', fontSize: 13, marginTop: 8 }}>
          Folosește acest cod pentru promoții exclusive la River&apos;s Lounge.
        </p>
      </div>

      {/* 3. Zi de naștere */}
      <SectionCard title="🎂 Zi de naștere">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ color: '#9A9490', fontSize: 13, marginBottom: 2 }}>
            Adaugă data nașterii pentru a primi credit în portofel de ziua ta (valoare = vârsta ta în RON).
            Adăugând și anul, creditul se calculează automat.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <label style={{ color: '#9A9490', fontSize: 13, flex: 1, minWidth: 120 }}>
              Luna
              <select
                value={bdayMonth}
                onChange={(e) => setBdayMonth(e.target.value)}
                style={{ ...inputStyle, marginTop: 4 }}
              >
                <option value="">Selectează luna</option>
                {['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'].map((m, i) => (
                  <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                ))}
              </select>
            </label>
            <label style={{ color: '#9A9490', fontSize: 13, flex: 1, minWidth: 80 }}>
              Ziua
              <select
                value={bdayDay}
                onChange={(e) => setBdayDay(e.target.value)}
                style={{ ...inputStyle, marginTop: 4 }}
              >
                <option value="">Ziua</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
                ))}
              </select>
            </label>
            <label style={{ color: '#9A9490', fontSize: 13, flex: 1, minWidth: 100 }}>
              Anul <span style={{ color: '#C9A84C' }}>(opțional, pentru credit)</span>
              <select
                value={bdayYear}
                onChange={(e) => setBdayYear(e.target.value)}
                style={{ ...inputStyle, marginTop: 4 }}
              >
                <option value="">Anul nașterii</option>
                {Array.from({ length: currentYear - 1924 }, (_, i) => currentYear - 5 - i).map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </label>
          </div>
          <button style={{ ...btnGold, alignSelf: 'flex-start' }} onClick={handleSaveBirthday}>
            Salvează data nașterii
          </button>
        </div>
      </SectionCard>

      {/* 4. Schimbă parola */}
      <SectionCard title="Schimbă parola">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ color: '#9A9490', fontSize: 13 }}>
            Parola actuală
            <input
              type="password"
              style={{ ...inputStyle, marginTop: 4 }}
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
            />
          </label>
          <label style={{ color: '#9A9490', fontSize: 13 }}>
            Parola nouă (min. 8 caractere)
            <input
              type="password"
              style={{ ...inputStyle, marginTop: 4 }}
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
            />
          </label>
          <label style={{ color: '#9A9490', fontSize: 13 }}>
            Confirmă parola nouă
            <input
              type="password"
              style={{ ...inputStyle, marginTop: 4 }}
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
            />
          </label>
          {pwError && <p style={{ color: '#F87171', fontSize: 13 }}>{pwError}</p>}
          <button style={{ ...btnGold, alignSelf: 'flex-start' }} onClick={handleChangePassword}>
            Schimbă parola
          </button>
          <ForgotPasswordInline userEmail={user.email} />
        </div>
      </SectionCard>

      {/* 4. Adrese salvate */}
      <SectionCard title="Adrese salvate">
        {savedAddresses.length === 0 ? (
          <p style={{ color: '#9A9490', fontSize: 14 }}>Nicio adresă de livrare salvată.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {savedAddresses.map((a, idx) => {
              const full = [a.address, a.addressDetails, a.city].filter(Boolean).join(', ');
              return (
                <div
                  key={full}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: idx === 0 ? 'rgba(201,168,76,0.07)' : '#0F0F0F',
                    border: idx === 0 ? '1px solid rgba(201,168,76,0.25)' : '1px solid #2E2E2E',
                    borderRadius: 8, padding: '10px 14px', gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1 }}>
                    <span style={{ fontSize: 14 }}>📍</span>
                    <div>
                      <p style={{ fontSize: 14, color: '#F0EDE6' }}>{full}</p>
                      {idx === 0 && (
                        <span style={{ fontSize: 11, color: '#C9A84C', fontWeight: 600 }}>Adresă principală</span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#9A9490', whiteSpace: 'nowrap' }}>
                    folosită de {a.count} {a.count === 1 ? 'ori' : 'ori'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* 5. Preferințe notificări */}
      <SectionCard title="Preferințe notificări">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ToggleRow
            label="Confirmări comenzi prin WhatsApp"
            checked={notifOrders}
            onChange={setNotifOrders}
          />
          <ToggleRow
            label="Noutăți și promoții"
            checked={notifPromos}
            onChange={setNotifPromos}
          />
          <p style={{ fontSize: 12, color: '#9A9490', fontStyle: 'italic' }}>
            (Funcționalitate în curând)
          </p>
        </div>
      </SectionCard>

      {/* 6. Conturi conectate */}
      <SectionCard title="Conturi conectate">
        <p style={{ color: '#9A9490', fontSize: 13, marginBottom: 14 }}>
          Conectează contul tău pentru autentificare rapidă cu un singur click.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Google */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0F0F0F', border: '1px solid #2E2E2E', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span style={{ fontSize: 14, color: '#F0EDE6', fontWeight: 500 }}>Google</span>
            </div>
            {user.googleId ? (
              <span style={{ fontSize: 12, color: '#4ADE80', fontWeight: 600 }}>✓ Conectat</span>
            ) : (
              <a
                href="/api/auth/google"
                style={{ fontSize: 12, color: '#C9A84C', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}
              >
                Conectează
              </a>
            )}
          </div>
          {/* Facebook */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0F0F0F', border: '1px solid #2E2E2E', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span style={{ fontSize: 14, color: '#F0EDE6', fontWeight: 500 }}>Facebook</span>
            </div>
            {user.facebookId ? (
              <span style={{ fontSize: 12, color: '#4ADE80', fontWeight: 600 }}>✓ Conectat</span>
            ) : (
              <a
                href="/api/auth/facebook"
                style={{ fontSize: 12, color: '#C9A84C', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}
              >
                Conectează
              </a>
            )}
          </div>
        </div>
      </SectionCard>

      {/* 7. Zona periculoasă */}
      <div style={{ background: '#1A1A1A', border: '1px solid #EF444433', borderRadius: 12, padding: '22px 24px' }}>
        <h3 style={{ color: '#F87171', fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Zona periculoasă</h3>
        {!showDeleteConfirm ? (
          <div>
            <p style={{ color: '#9A9490', fontSize: 14, marginBottom: 14 }}>
              Ștergerea contului este permanentă și nu poate fi anulată.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{ background: 'transparent', color: '#F87171', border: '1px solid #F87171', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              Șterge contul
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: '#F87171', fontSize: 14, fontWeight: 600 }}>
              Sigur vrei să ștergi contul? Această acțiune este permanentă.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleDeleteAccount}
                style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
              >
                Da, șterge contul
              </button>
              <button style={btnGhost} onClick={() => setShowDeleteConfirm(false)}>
                Anulează
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 14, color: '#F0EDE6' }}>{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
          background: checked ? '#C9A84C' : '#2E2E2E',
          position: 'relative', flexShrink: 0, transition: 'background 0.2s',
        }}
      >
        <span
          style={{
            position: 'absolute', top: 3, left: checked ? 22 : 3, width: 18, height: 18,
            background: '#fff', borderRadius: '50%', transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  );
}
