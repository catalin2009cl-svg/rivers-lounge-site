'use client';

import { useState, useEffect } from 'react';
import { Level3BonusChoiceModal } from './Level3BonusChoiceModal';

interface Props {
  walletBalance: number;
  level3BonusExpiresAt: string;
  onChosen?: (choice: 'WALLET_DOUBLE' | 'CASHBACK_BOOST') => void;
}

export function Level3BonusExpiryBanner({ walletBalance, level3BonusExpiresAt, onChosen }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const check = () => {
      setExpired(new Date(level3BonusExpiresAt) <= new Date());
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, [level3BonusExpiresAt]);

  if (expired) return null;

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowModal(true)}
        style={{
          background: 'linear-gradient(135deg, rgba(234,179,8,0.1) 0%, rgba(201,168,76,0.05) 100%)',
          border: '1px solid rgba(234,179,8,0.5)',
          borderRadius: 14, padding: '14px 20px', marginBottom: 16,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
          transition: 'background 0.2s',
        }}
      >
        <span style={{ fontSize: 24, flexShrink: 0 }}>🎁</span>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#FACC15', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
            Bonus Client Premium disponibil!
          </p>
          <p style={{ color: '#9A9490', fontSize: 12 }}>
            Alege bonusul tău de bun-venit la Nivel 3 — fereastra se închide în curând.
          </p>
        </div>
        <span style={{ color: '#C9A84C', fontSize: 18, flexShrink: 0 }}>→</span>
      </div>

      <Level3BonusChoiceModal
        isOpen={showModal}
        walletBalance={walletBalance}
        level3BonusExpiresAt={level3BonusExpiresAt}
        onClose={() => setShowModal(false)}
        onChosen={(choice) => {
          setShowModal(false);
          onChosen?.(choice);
        }}
      />
    </>
  );
}
