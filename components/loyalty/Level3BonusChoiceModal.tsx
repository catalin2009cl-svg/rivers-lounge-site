'use client';

import { useState, useEffect, useCallback } from 'react';

interface Props {
  isOpen: boolean;
  walletBalance: number;
  level3BonusExpiresAt: string;
  onClose: () => void;
  onChosen: (choice: 'WALLET_DOUBLE' | 'CASHBACK_BOOST') => void;
}

function useCountdown(expiresAt: string) {
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, new Date(expiresAt).getTime() - Date.now())
  );

  useEffect(() => {
    const tick = () =>
      setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { remaining, h, m, s };
}

export function Level3BonusChoiceModal({
  isOpen,
  walletBalance,
  level3BonusExpiresAt,
  onClose,
  onChosen,
}: Props) {
  const { remaining, h, m, s } = useCountdown(level3BonusExpiresAt);
  const [chosen, setChosen] = useState<'WALLET_DOUBLE' | 'CASHBACK_BOOST' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = useCallback(async () => {
    if (!chosen) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/loyalty/choose-level3-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice: chosen }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Eroare');
      }
      setDone(true);
      onChosen(chosen);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare necunoscută');
    } finally {
      setLoading(false);
    }
  }, [chosen, onChosen]);

  if (!isOpen) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(6px)',
          zIndex: 9990,
        }}
      />
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9991,
          background: '#1A1A1A',
          border: '1px solid rgba(201,168,76,0.4)',
          borderRadius: 20,
          padding: '32px 28px',
          width: '100%', maxWidth: 480,
          maxHeight: '92vh', overflowY: 'auto',
          boxShadow: '0 0 60px rgba(201,168,76,0.15)',
        }}
      >
        {done ? (
          /* Confirmation screen */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              Bonus activat!
            </h2>
            {chosen === 'WALLET_DOUBLE' ? (
              <p style={{ color: '#F0EDE6', fontSize: 15 }}>
                Portofelul tău a fost dublat la{' '}
                <strong style={{ color: '#C9A84C' }}>
                  {(walletBalance * 2).toFixed(2)} RON
                </strong>.
              </p>
            ) : (
              <p style={{ color: '#F0EDE6', fontSize: 15 }}>
                Ai activat <strong style={{ color: '#C9A84C' }}>cashback 5%</strong> pentru
                următoarele <strong style={{ color: '#C9A84C' }}>10 comenzi</strong>.
              </p>
            )}
            <button
              onClick={onClose}
              style={{
                marginTop: 24, background: '#C9A84C', color: '#0F0F0F',
                border: 'none', borderRadius: 10, padding: '12px 32px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Super, mulțumesc!
            </button>
          </div>
        ) : confirming && chosen ? (
          /* Confirm step */
          <div>
            <h2 style={{ color: '#F0EDE6', fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              Confirmi alegerea?
            </h2>
            <div style={{
              background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 12, padding: '16px 20px', marginBottom: 20,
            }}>
              {chosen === 'WALLET_DOUBLE' ? (
                <>
                  <p style={{ color: '#C9A84C', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>💳 Portofel Dublat</p>
                  <p style={{ color: '#9A9490', fontSize: 13 }}>
                    Soldul tău de <strong style={{ color: '#F0EDE6' }}>{walletBalance.toFixed(2)} RON</strong> va deveni{' '}
                    <strong style={{ color: '#C9A84C' }}>{(walletBalance * 2).toFixed(2)} RON</strong>.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ color: '#C9A84C', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🚀 Boost Cashback 5%</p>
                  <p style={{ color: '#9A9490', fontSize: 13 }}>
                    Vei câștiga <strong style={{ color: '#F0EDE6' }}>5% cashback</strong> pe
                    următoarele <strong style={{ color: '#F0EDE6' }}>10 comenzi</strong>.
                  </p>
                </>
              )}
            </div>
            <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 20 }}>
              ⚠️ Această alegere este permanentă și nu poate fi schimbată.
            </p>
            {error && (
              <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                style={{
                  flex: 1, background: 'transparent', color: '#9A9490',
                  border: '1px solid #2E2E2E', borderRadius: 10,
                  padding: '11px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}
              >
                Înapoi
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  flex: 2, background: '#C9A84C', color: '#0F0F0F',
                  border: 'none', borderRadius: 10,
                  padding: '11px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {loading ? 'Se activează...' : 'Confirmare finală'}
              </button>
            </div>
          </div>
        ) : (
          /* Choice screen */
          <div>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⚡</div>
              <h2 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
                Ai atins Nivelul 3 — Client Premium!
              </h2>
              <p style={{ color: '#9A9490', fontSize: 13 }}>
                Alege bonusul tău de bun-venit:
              </p>
            </div>

            {/* Countdown */}
            {remaining > 0 && (
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <p style={{ color: '#9A9490', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Timp rămas pentru alegere
                </p>
                <p style={{ color: remaining < 3600000 ? '#f59e0b' : '#F0EDE6', fontFamily: 'monospace', fontSize: 22, fontWeight: 700 }}>
                  {pad(h)}:{pad(m)}:{pad(s)}
                </p>
              </div>
            )}

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {/* WALLET_DOUBLE */}
              <button
                onClick={() => setChosen('WALLET_DOUBLE')}
                style={{
                  background: chosen === 'WALLET_DOUBLE' ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.02)',
                  border: `2px solid ${chosen === 'WALLET_DOUBLE' ? '#C9A84C' : '#2E2E2E'}`,
                  borderRadius: 14, padding: '18px 20px', textAlign: 'left', cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>💳</span>
                  <div>
                    <p style={{ color: '#F0EDE6', fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
                      Portofel Dublat
                    </p>
                    <p style={{ color: '#9A9490', fontSize: 12 }}>
                      Soldul tău actual ({walletBalance.toFixed(2)} RON) devine{' '}
                      <strong style={{ color: '#C9A84C' }}>{(walletBalance * 2).toFixed(2)} RON</strong> instant.
                    </p>
                  </div>
                  {chosen === 'WALLET_DOUBLE' && (
                    <span style={{ marginLeft: 'auto', color: '#C9A84C', fontSize: 20, flexShrink: 0 }}>✓</span>
                  )}
                </div>
              </button>

              {/* CASHBACK_BOOST */}
              <button
                onClick={() => setChosen('CASHBACK_BOOST')}
                style={{
                  background: chosen === 'CASHBACK_BOOST' ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.02)',
                  border: `2px solid ${chosen === 'CASHBACK_BOOST' ? '#C9A84C' : '#2E2E2E'}`,
                  borderRadius: 14, padding: '18px 20px', textAlign: 'left', cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>🚀</span>
                  <div>
                    <p style={{ color: '#F0EDE6', fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
                      Boost Cashback 5%
                    </p>
                    <p style={{ color: '#9A9490', fontSize: 12 }}>
                      Câștigă <strong style={{ color: '#C9A84C' }}>5% cashback</strong> pe
                      următoarele <strong style={{ color: '#C9A84C' }}>10 comenzi</strong> în loc de 3%.
                    </p>
                  </div>
                  {chosen === 'CASHBACK_BOOST' && (
                    <span style={{ marginLeft: 'auto', color: '#C9A84C', fontSize: 20, flexShrink: 0 }}>✓</span>
                  )}
                </div>
              </button>
            </div>

            {/* CTA */}
            <button
              disabled={!chosen}
              onClick={() => setConfirming(true)}
              style={{
                width: '100%',
                background: chosen ? '#C9A84C' : 'rgba(201,168,76,0.2)',
                color: chosen ? '#0F0F0F' : '#9A9490',
                border: 'none', borderRadius: 12,
                padding: '14px', fontSize: 15, fontWeight: 700, cursor: chosen ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}
            >
              {chosen ? 'Continuă →' : 'Selectează un bonus'}
            </button>

            <button
              onClick={onClose}
              style={{
                display: 'block', margin: '12px auto 0', background: 'none',
                border: 'none', color: '#555', fontSize: 12, cursor: 'pointer',
              }}
            >
              Aleg mai târziu
            </button>
          </div>
        )}
      </div>
    </>
  );
}
