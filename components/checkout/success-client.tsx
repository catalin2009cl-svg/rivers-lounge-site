'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { openReceipt } from '@/lib/receipt-generator';
import type { Order } from '@/lib/server-data';

interface Props {
  isLoggedIn: boolean;
  order?: Order | null;
}

export function SuccessClient({ isLoggedIn, order }: Props) {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id') || '';
  const phone = searchParams.get('phone') || '';
  const name = searchParams.get('name') || '';
  const total = searchParams.get('total') || '';
  const [copied, setCopied] = useState(false);

  function copyOrderId() {
    navigator.clipboard.writeText(orderId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  const waMessage = [
    'Comandă nouă Rivers Lounge',
    '',
    `ID: ${orderId}`,
    name && `Nume: ${name}`,
    `Telefon: ${phone}`,
    total && `Total: ${total} RON`,
  ].filter(Boolean).join('\n');
  const waUrl = `https://wa.me/40725635020?text=${encodeURIComponent(waMessage)}`;

  return (
    <div
      className="min-h-[80vh] flex items-center justify-center px-4 py-16"
      style={{ background: '#0F0F0F' }}
    >
      <div style={{ maxWidth: '480px', width: '100%' }}>

        {/* Success icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle2 style={{ width: '40px', height: '40px', color: '#4ADE80' }} />
          </div>
        </div>

        {/* Heading */}
        <h1 style={{
          textAlign: 'center', fontFamily: 'Georgia, serif',
          fontSize: '26px', fontWeight: 700, color: '#F0EDE6', marginBottom: '8px',
        }}>
          Comandă plasată cu succes!
        </h1>
        <p style={{ textAlign: 'center', color: '#9A9490', fontSize: '14px', marginBottom: '28px' }}>
          Restaurantul a primit comanda ta și o pregătește acum.
        </p>

        {/* Order details card */}
        <div style={{
          background: '#1A1A1A', border: '1px solid #2E2E2E',
          borderRadius: '12px', padding: '20px', marginBottom: '16px',
        }}>

          {/* Order ID */}
          {orderId && (
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #2E2E2E' }}>
              <p style={{
                fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em',
                color: '#9A9490', margin: '0 0 8px',
              }}>
                Număr comandă
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: '15px', fontWeight: 700,
                  color: '#C9A84C', flex: 1, wordBreak: 'break-all',
                }}>
                  {orderId}
                </span>
                <button
                  onClick={copyOrderId}
                  style={{
                    background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(201,168,76,0.1)',
                    border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(201,168,76,0.3)'}`,
                    borderRadius: '6px',
                    color: copied ? '#4ADE80' : '#C9A84C',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '5px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {copied ? '✓ Copiat!' : '📋 Copiază'}
                </button>
              </div>
              {!isLoggedIn && (
                <p style={{ fontSize: '11px', color: '#9A9490', marginTop: '6px' }}>
                  Notează acest număr pentru referință.
                </p>
              )}
            </div>
          )}

          {/* Time estimate */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>⏱️</span>
            <div>
              <p style={{ color: '#9A9490', fontSize: '12px', margin: 0 }}>Timp estimat</p>
              <p style={{ color: '#F0EDE6', fontSize: '14px', fontWeight: 600, margin: '2px 0 0' }}>
                45–60 minute
              </p>
            </div>
          </div>

          {/* Phone */}
          {phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>📞</span>
              <div>
                <p style={{ color: '#9A9490', fontSize: '12px', margin: 0 }}>
                  Te contactăm la
                </p>
                <p style={{ color: '#F0EDE6', fontSize: '14px', fontWeight: 600, margin: '2px 0 0' }}>
                  {phone}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Primary actions */}
        {isLoggedIn ? (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <Link href="/cont/comenzi" style={{ flex: 1, textDecoration: 'none' }}>
              <button style={{
                width: '100%', background: '#C9A84C', color: '#0F0F0F',
                border: 'none', borderRadius: '10px', padding: '12px 16px',
                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                📦 Urmărește comanda
              </button>
            </Link>
            <Link href="/meniu" style={{ flex: 1, textDecoration: 'none' }}>
              <button style={{
                width: '100%', background: 'none', color: '#C9A84C',
                border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px',
                padding: '12px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                🍽️ Meniu
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ marginBottom: '16px' }}>
            <Link href="/meniu" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%', background: '#C9A84C', color: '#0F0F0F',
                border: 'none', borderRadius: '10px', padding: '12px 16px',
                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                🍽️ Înapoi la meniu
              </button>
            </Link>
          </div>
        )}

        {/* Guest: create account promo */}
        {!isLoggedIn && (
          <div style={{
            background: '#1A1A1A', border: '1px solid #2E2E2E',
            borderRadius: '12px', padding: '16px', marginBottom: '16px',
          }}>
            <p style={{ color: '#F0EDE6', fontSize: '13px', fontWeight: 600, margin: '0 0 4px' }}>
              💡 Urmărește comanda în timp real
            </p>
            <p style={{ color: '#9A9490', fontSize: '12px', margin: '0 0 12px' }}>
              Creează un cont gratuit pentru a vedea statusul comenzilor tale.
            </p>
            <Link href="/cont/inregistrare" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%', background: 'none', color: '#C9A84C',
                border: '1px solid rgba(201,168,76,0.4)', borderRadius: '8px',
                padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>
                Creează cont gratuit →
              </button>
            </Link>
          </div>
        )}

        {/* Receipt download */}
        {order && (
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={() => openReceipt(order)}
              style={{
                width: '100%',
                background: 'transparent',
                color: '#C9A84C',
                border: '1px solid rgba(201,168,76,0.5)',
                borderRadius: '10px',
                padding: '11px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              📄 Descarcă bon de comandă
            </button>
          </div>
        )}

        {/* WhatsApp */}
        <div style={{ borderTop: '1px solid #2E2E2E', paddingTop: '16px' }}>
          {isLoggedIn ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#9A9490', fontSize: '12px', display: 'flex',
                alignItems: 'center', gap: '6px', justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              📱 Trimite și pe WhatsApp (opțional)
            </a>
          ) : (
            <div>
              <p style={{ color: '#9A9490', fontSize: '12px', textAlign: 'center', margin: '0 0 10px' }}>
                📱 Trimite detaliile pe WhatsApp pentru o confirmare mai rapidă
              </p>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', textDecoration: 'none' }}
              >
                <button style={{
                  width: '100%',
                  background: 'rgba(37,211,102,0.08)',
                  color: '#25D366',
                  border: '1px solid rgba(37,211,102,0.25)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  Deschide WhatsApp →
                </button>
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
