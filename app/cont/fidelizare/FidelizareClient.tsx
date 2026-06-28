'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LevelUpModal } from '@/components/loyalty/LevelUpModal';
import type { LoyaltyLevel, ActiveReward, WalletTransactionSummary } from '@/lib/loyalty/types';

interface RewardHistory {
  id: string;
  rewardType: string;
  rewardValue: number;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  usedOnOrderId: string | null;
}

interface Props {
  userName: string;
  currentLevel: number;
  currentLevelName: string;
  totalCompletedOrders: number;
  ordersRequired: number;
  activeReward: ActiveReward | null;
  levels: LoyaltyLevel[];
  rewards: RewardHistory[];
  nextLevelName: string | null;
  ordersToNextLevel: number | null;
  walletBalance: number;
  walletExpiresAt: string | null;
  walletTransactions: WalletTransactionSummary[];
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    ACTIVE:    { label: 'Activă',   color: '#16a34a' },
    USED:      { label: 'Folosită', color: '#2563eb' },
    EXPIRED:   { label: 'Expirată', color: '#9ca3af' },
    CANCELLED: { label: 'Anulată',  color: '#dc2626' },
  };
  const cfg = map[status] ?? { label: status, color: '#9ca3af' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px',
      borderRadius: 999, border: `1px solid ${cfg.color}`,
      color: cfg.color, background: `${cfg.color}15`,
    }}>
      {cfg.label}
    </span>
  );
}

function TxTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string }> = {
    CASHBACK_EARNED:  { label: 'Cashback',     color: '#16a34a' },
    CASHBACK_EXPIRED: { label: 'Exp. cashback',color: '#9ca3af' },
    CREDIT_USED:      { label: 'Folosit',      color: '#2563eb' },
    CREDIT_EXPIRED:   { label: 'Expirat',      color: '#9ca3af' },
    MANUAL_CREDIT:    { label: 'Credit manual',color: '#C9A84C' },
    MANUAL_DEBIT:     { label: 'Debit manual', color: '#dc2626' },
  };
  const cfg = map[type] ?? { label: type, color: '#9ca3af' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px',
      borderRadius: 999, border: `1px solid ${cfg.color}`,
      color: cfg.color, background: `${cfg.color}15`,
    }}>
      {cfg.label}
    </span>
  );
}

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function FidelizareClient({
  userName,
  currentLevel,
  currentLevelName,
  totalCompletedOrders,
  ordersRequired,
  activeReward,
  levels,
  rewards,
  nextLevelName,
  ordersToNextLevel,
  walletBalance,
  walletExpiresAt,
  walletTransactions,
}: Props) {
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);

  useEffect(() => {
    const key = `levelup_shown_level2`;
    const alreadyShown = sessionStorage.getItem(key);
    if (!alreadyShown && currentLevel >= 2) {
      sessionStorage.setItem(key, '1');
      setShowLevelUpModal(true);
    }
  }, [currentLevel]);

  const progressPercent =
    ordersRequired > 0
      ? Math.min(100, (totalCompletedOrders / ordersRequired) * 100)
      : 100;

  const ordersLeft = Math.max(0, ordersRequired - totalCompletedOrders);

  const walletExpiresDate = walletExpiresAt ? new Date(walletExpiresAt) : null;
  const now = new Date();
  const walletExpiresSoon =
    walletExpiresDate &&
    walletExpiresDate > now &&
    walletExpiresDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div style={{ background: '#080808', minHeight: '100vh', paddingTop: 80 }}>

      <LevelUpModal
        show={showLevelUpModal}
        levelName="Nivel 2 — Client Fidel"
        rewardValue={activeReward?.rewardValue}
        onClose={() => setShowLevelUpModal(false)}
      />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>

        <Link
          href="/cont"
          style={{ fontSize: 13, color: '#9A9490', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}
        >
          ← Înapoi la cont
        </Link>

        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: '#F0EDE6', marginBottom: 4 }}>
          Program Fidelizare
        </h1>
        <p style={{ color: '#9A9490', fontSize: 14, marginBottom: 32 }}>
          Bun venit, {userName}! Urmărește progresul tău.
        </p>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)',
          border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: 20, padding: '32px 28px', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              background: 'linear-gradient(135deg, #C9A84C, #A07830)',
              color: '#080808', borderRadius: 10, padding: '6px 14px',
              fontSize: 13, fontWeight: 700,
            }}>
              Nivel {currentLevel}
            </div>
            <span style={{ color: '#C9A84C', fontSize: 16, fontWeight: 700 }}>{currentLevelName}</span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: 999,
              height: 10, overflow: 'hidden', marginBottom: 8,
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%', borderRadius: 999,
                background: 'linear-gradient(90deg, #C9A84C, #F5D98B)',
                transition: 'width 0.8s ease',
              }} />
            </div>
            <p style={{ color: '#9A9490', fontSize: 13 }}>
              {totalCompletedOrders} din {ordersRequired} comenzi completate
            </p>
          </div>

          {activeReward ? (
            <p style={{ color: '#4ade80', fontSize: 14, fontWeight: 600 }}>
              🎁 Ai deblocat recompensa de loialitate! Valabilă până pe {fmt(activeReward.expiresAt)}.
            </p>
          ) : ordersLeft > 0 ? (
            <p style={{ color: '#9A9490', fontSize: 14 }}>
              Mai ai nevoie de <strong style={{ color: '#F0EDE6' }}>{ordersLeft} comenzi</strong> pentru a debloca recompensa 🎁
            </p>
          ) : (
            <p style={{ color: '#C9A84C', fontSize: 14, fontWeight: 600 }}>
              Ai finalizat cele {ordersRequired} comenzi! Recompensa ta a fost emisă.
            </p>
          )}

          {nextLevelName && ordersToNextLevel !== null && (
            <p style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
              Până la {nextLevelName}: {ordersToNextLevel} comenzi
            </p>
          )}
        </div>

        {/* ── Active reward ────────────────────────────────────────────────── */}
        {activeReward && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(74,222,128,0.06) 0%, rgba(34,197,94,0.03) 100%)',
            border: '1px solid rgba(74,222,128,0.3)',
            borderRadius: 20, padding: '28px 24px', marginBottom: 24,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
            <h2 style={{ color: '#4ade80', fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Comandă gratuită deblocată!
            </h2>
            <p style={{ color: '#9A9490', fontSize: 14, marginBottom: 4 }}>
              Valoare maximă: <strong style={{ color: '#F0EDE6' }}>{activeReward.rewardValue.toFixed(0)} RON</strong>
            </p>
            <p style={{ color: '#9A9490', fontSize: 14, marginBottom: 20 }}>
              Valabilă până pe: <strong style={{ color: '#F0EDE6' }}>{fmt(activeReward.expiresAt)}</strong>
            </p>
            <p style={{ color: '#666', fontSize: 12, marginBottom: 20 }}>
              Dacă comanda depășește {activeReward.rewardValue.toFixed(0)} RON, plătești doar diferența.
            </p>
            <Link
              href="/comanda/checkout"
              style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'linear-gradient(135deg, #C9A84C, #A07830)',
                color: '#080808', borderRadius: 10, padding: '12px 24px',
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
              }}
            >
              Comandă acum →
            </Link>
          </div>
        )}

        {/* ── Portofelul Meu (Level 2+) ────────────────────────────────────── */}
        {currentLevel >= 2 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(201,168,76,0.02) 100%)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 20, padding: '28px 24px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 24 }}>💳</span>
              <h2 style={{ color: '#F0EDE6', fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700 }}>
                Portofelul Meu
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: '#C9A84C', fontFamily: 'Georgia, serif' }}>
                {walletBalance.toFixed(2)}
              </span>
              <span style={{ fontSize: 16, color: '#9A9490', fontWeight: 600 }}>RON</span>
            </div>

            {walletBalance > 0 && walletExpiresDate && (
              <p style={{ fontSize: 13, color: walletExpiresSoon ? '#f59e0b' : '#9A9490', marginBottom: 12 }}>
                {walletExpiresSoon ? '⚠️ ' : ''}
                Credit valabil până pe{' '}
                <strong style={{ color: walletExpiresSoon ? '#f59e0b' : '#F0EDE6' }}>
                  {fmt(walletExpiresAt)}
                </strong>
                {walletExpiresSoon && ' — folosește-l curând!'}
              </p>
            )}

            {walletBalance <= 0 && (
              <p style={{ fontSize: 13, color: '#9A9490', marginBottom: 12 }}>
                Câștigă <strong style={{ color: '#C9A84C' }}>cashback 3%</strong> pe fiecare comandă livrată și acumulează credit pentru comenzi viitoare.
              </p>
            )}

            {walletBalance > 0 && (
              <Link
                href="/comanda/checkout"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  background: 'linear-gradient(135deg, #C9A84C, #A07830)',
                  color: '#080808', borderRadius: 10, padding: '10px 20px',
                  fontSize: 13, fontWeight: 700, textDecoration: 'none', marginBottom: 20,
                }}
              >
                Folosește creditul →
              </Link>
            )}

            {walletTransactions.length > 0 && (
              <div style={{ marginTop: walletBalance > 0 ? 24 : 0 }}>
                <h3 style={{ color: '#9A9490', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  Tranzacții recente
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Tip', 'Sumă', 'Sold după', 'Data'].map((h) => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#555', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {walletTransactions.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 12px' }}><TxTypeBadge type={t.type} /></td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: t.amount >= 0 ? '#4ade80' : '#f87171' }}>
                            {t.amount >= 0 ? '+' : ''}{t.amount.toFixed(2)} RON
                          </td>
                          <td style={{ padding: '10px 12px', color: '#F0EDE6' }}>{t.balanceAfter.toFixed(2)} RON</td>
                          <td style={{ padding: '10px 12px', color: '#9A9490' }}>{fmt(t.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Road to Elite ────────────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20, padding: '28px 24px', marginBottom: 24,
        }}>
          <h2 style={{ color: '#F0EDE6', fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
            Drumul spre Elite
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {levels.map((level) => {
              const isCurrentLevel = level.level === currentLevel;
              const isPast = level.level < currentLevel;
              const isFuture = level.level > currentLevel;
              return (
                <div
                  key={level.level}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 12,
                    background: isCurrentLevel ? 'rgba(201,168,76,0.08)' : 'transparent',
                    border: isCurrentLevel ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
                    opacity: isFuture ? 0.4 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: isCurrentLevel
                      ? 'linear-gradient(135deg, #C9A84C, #A07830)'
                      : isPast ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700,
                    color: isCurrentLevel ? '#080808' : isPast ? '#4ade80' : '#555',
                  }}>
                    {isPast ? '✓' : level.level}
                  </div>
                  <div>
                    <p style={{ color: isCurrentLevel ? '#C9A84C' : isPast ? '#F0EDE6' : '#555', fontSize: 14, fontWeight: isCurrentLevel ? 700 : 500 }}>
                      {level.name}
                      {isCurrentLevel && (
                        <span style={{ marginLeft: 8, fontSize: 10, background: 'rgba(201,168,76,0.2)', color: '#C9A84C', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                          ACUM
                        </span>
                      )}
                      {level.level === 2 && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: '#9A9490' }}>· cashback 3%</span>
                      )}
                    </p>
                    <p style={{ color: '#555', fontSize: 12 }}>
                      {level.minOrders}{level.maxOrders !== null ? `–${level.maxOrders}` : '+'} comenzi
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Reward history ───────────────────────────────────────────────── */}
        {rewards.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, padding: '28px 24px',
          }}>
            <h2 style={{ color: '#F0EDE6', fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              Istoricul recompenselor
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Tip', 'Valoare', 'Status', 'Emisă', 'Expiră'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#555', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 12px', color: '#9A9490' }}>{r.rewardType === 'FREE_ORDER' ? 'Comandă Gratuită' : r.rewardType}</td>
                      <td style={{ padding: '10px 12px', color: '#F0EDE6', fontWeight: 600 }}>{r.rewardValue.toFixed(0)} RON</td>
                      <td style={{ padding: '10px 12px' }}><StatusBadge status={r.status} /></td>
                      <td style={{ padding: '10px 12px', color: '#9A9490' }}>{fmt(r.issuedAt)}</td>
                      <td style={{ padding: '10px 12px', color: '#9A9490' }}>{fmt(r.expiresAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
