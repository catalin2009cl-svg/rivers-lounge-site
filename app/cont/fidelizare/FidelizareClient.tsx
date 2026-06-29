'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LevelUpModal } from '@/components/loyalty/LevelUpModal';
import { Level3BonusExpiryBanner } from '@/components/loyalty/Level3BonusExpiryBanner';
import type { LoyaltyLevel, ActiveReward, WalletTransactionSummary, ReferralSummary } from '@/lib/loyalty/types';

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
  // Level 3 fields
  totalCashbackEarned: number;
  cashbackLast30Days: number;
  cashbackThreshold30Days: number;
  level3BonusChoice: string | null;
  level3BonusExpiresAt: string | null;
  level3CashbackBoostLeft: number;
  priorityDelivery: boolean;
  // Level 4 fields
  totalReferrals: number;
  referralCashbackEarned: number;
  upgradeReferralsRequired: number;
  referralCode: string | null;
  referrals: ReferralSummary[];
  welcomeBonusActive: boolean;
  welcomeBonusMinOrderValue: number;
  hasBirthdayCredit: boolean;
  hasBirthDate: boolean;
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
    CASHBACK_EARNED:    { label: 'Cashback',       color: '#16a34a' },
    CASHBACK_EXPIRED:   { label: 'Exp. cashback',  color: '#9ca3af' },
    CREDIT_USED:        { label: 'Folosit',         color: '#2563eb' },
    CREDIT_EXPIRED:     { label: 'Expirat',         color: '#9ca3af' },
    MANUAL_CREDIT:      { label: 'Credit manual',   color: '#C9A84C' },
    MANUAL_DEBIT:       { label: 'Debit manual',    color: '#dc2626' },
    LEVEL_BONUS:        { label: 'Bonus Nivel 3',   color: '#FACC15' },
    REFERRAL_CASHBACK:  { label: 'Cashback referral',color: '#a78bfa' },
    REFERRAL_WELCOME:   { label: 'Bun venit',       color: '#34d399' },
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

function ReferralStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    PENDING:   { label: 'Pending',  color: '#9ca3af' },
    ACTIVE:    { label: 'Activ',    color: '#a78bfa' },
    COMPLETED: { label: 'Complet',  color: '#34d399' },
  };
  const cfg = map[status] ?? { label: status, color: '#9ca3af' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px',
      borderRadius: 999, border: `1px solid ${cfg.color}`,
      color: cfg.color, background: `${cfg.color}18`,
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
  totalCashbackEarned,
  cashbackLast30Days,
  cashbackThreshold30Days,
  level3BonusChoice,
  level3BonusExpiresAt,
  level3CashbackBoostLeft,
  priorityDelivery,
  totalReferrals,
  referralCashbackEarned,
  upgradeReferralsRequired,
  referralCode,
  referrals,
  welcomeBonusActive,
  welcomeBonusMinOrderValue,
  hasBirthdayCredit,
  hasBirthDate,
}: Props) {
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    const key = `levelup_shown_level2`;
    const alreadyShown = sessionStorage.getItem(key);
    if (!alreadyShown && currentLevel >= 2) {
      sessionStorage.setItem(key, '1');
      setShowLevelUpModal(true);
    }
  }, [currentLevel]);

  function copyReferralCode() {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode).then(() => {
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    });
  }

  const inviteLink = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://riverslounge.ro'}/cont/inregistrare?ref=${referralCode}`
    : null;

  function copyInviteLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    });
  }

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

  // Level 3 progress: cashback earned in last 30 days vs threshold
  const level3ProgressPercent =
    currentLevel < 3 && cashbackThreshold30Days > 0
      ? Math.min(100, (cashbackLast30Days / cashbackThreshold30Days) * 100)
      : 0;

  const hasBonusWindow =
    currentLevel >= 3 && !level3BonusChoice && !!level3BonusExpiresAt &&
    new Date(level3BonusExpiresAt) > now;

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

        {/* Level 3 bonus choice banner */}
        {hasBonusWindow && (
          <Level3BonusExpiryBanner
            walletBalance={walletBalance}
            level3BonusExpiresAt={level3BonusExpiresAt!}
          />
        )}

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)',
          border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: 20, padding: '32px 28px', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{
              background: 'linear-gradient(135deg, #C9A84C, #A07830)',
              color: '#080808', borderRadius: 10, padding: '6px 14px',
              fontSize: 13, fontWeight: 700,
            }}>
              Nivel {currentLevel}
            </div>
            <span style={{ color: '#C9A84C', fontSize: 16, fontWeight: 700 }}>{currentLevelName}</span>
            {priorityDelivery && (
              <span style={{
                background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.4)',
                color: '#FACC15', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 700,
              }}>
                ⚡ Livrare Prioritară
              </span>
            )}
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

        {/* ── Level 3 upgrade progress (Level 2 only) ──────────────────────── */}
        {currentLevel === 2 && cashbackThreshold30Days > 0 && (
          <div style={{
            background: 'rgba(234,179,8,0.04)',
            border: '1px solid rgba(234,179,8,0.2)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>⚡</span>
              <h3 style={{ color: '#FACC15', fontSize: 14, fontWeight: 700 }}>
                Progres spre Client Premium (Nivel 3)
              </h3>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: 999,
              height: 8, overflow: 'hidden', marginBottom: 6,
            }}>
              <div style={{
                width: `${level3ProgressPercent}%`, height: '100%', borderRadius: 999,
                background: 'linear-gradient(90deg, #FACC15, #F59E0B)',
                transition: 'width 0.8s ease',
              }} />
            </div>
            <p style={{ color: '#9A9490', fontSize: 12 }}>
              <strong style={{ color: '#FACC15' }}>{cashbackLast30Days.toFixed(2)} RON</strong>
              {' / '}{cashbackThreshold30Days} RON cashback în ultimele 30 zile
            </p>
            <p style={{ color: '#666', fontSize: 11, marginTop: 4 }}>
              Câștigă {cashbackThreshold30Days} RON cashback în 30 de zile pentru a te ridica la Nivel 3.
            </p>
          </div>
        )}

        {/* ── Level 3 status (Level 3+) ─────────────────────────────────────── */}
        {currentLevel >= 3 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(234,179,8,0.08) 0%, rgba(234,179,8,0.03) 100%)',
            border: '1px solid rgba(234,179,8,0.3)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <h3 style={{ color: '#FACC15', fontSize: 16, fontWeight: 700 }}>Client Premium — Nivel 3</h3>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {/* Priority delivery */}
              <div style={{
                background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)',
                borderRadius: 10, padding: '10px 14px', flex: '1 0 140px',
              }}>
                <p style={{ color: '#FACC15', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>⚡ Livrare Prioritară</p>
                <p style={{ color: '#9A9490', fontSize: 11 }}>~39 min estimat</p>
              </div>

              {/* Boost status */}
              {level3CashbackBoostLeft > 0 && (
                <div style={{
                  background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)',
                  borderRadius: 10, padding: '10px 14px', flex: '1 0 140px',
                }}>
                  <p style={{ color: '#4ade80', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>🚀 Boost 5% Cashback</p>
                  <p style={{ color: '#9A9490', fontSize: 11 }}>{level3CashbackBoostLeft} comenzi rămase</p>
                </div>
              )}

              {/* Bonus chosen */}
              {level3BonusChoice && (
                <div style={{
                  background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: 10, padding: '10px 14px', flex: '1 0 140px',
                }}>
                  <p style={{ color: '#C9A84C', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>🎁 Bonus ales</p>
                  <p style={{ color: '#9A9490', fontSize: 11 }}>
                    {level3BonusChoice === 'WALLET_DOUBLE' ? 'Portofel Dublat' : 'Boost Cashback 5%'}
                  </p>
                </div>
              )}

              {/* Total cashback */}
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '10px 14px', flex: '1 0 140px',
              }}>
                <p style={{ color: '#9A9490', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>💰 Total cashback</p>
                <p style={{ color: '#F0EDE6', fontSize: 13, fontWeight: 700 }}>{totalCashbackEarned.toFixed(2)} RON</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Birthday credit banner ───────────────────────────────────────── */}
        {hasBirthdayCredit && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.03) 100%)',
            border: '1px solid rgba(201,168,76,0.4)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>🎂</span>
              <h3 style={{ color: '#C9A84C', fontSize: 15, fontWeight: 700 }}>La mulți ani!</h3>
            </div>
            <p style={{ color: '#9A9490', fontSize: 13, lineHeight: 1.5 }}>
              Ai primit credit de ziua ta în portofel. Verifică soldul mai jos și folosește-l la
              urm&#259;toarea comandă.
            </p>
          </div>
        )}

        {/* ── No birth date set — encourage adding it ───────────────────────── */}
        {!hasBirthDate && !hasBirthdayCredit && (
          <div style={{
            background: 'rgba(201,168,76,0.04)',
            border: '1px dashed rgba(201,168,76,0.3)',
            borderRadius: 16, padding: '16px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ color: '#C9A84C', fontSize: 13, fontWeight: 600, marginBottom: 3 }}>🎂 Credit de ziua ta</p>
              <p style={{ color: '#9A9490', fontSize: 12 }}>
                Adaugă data nașterii în setări și primești credit RON egal cu vârsta ta în fiecare an!
              </p>
            </div>
            <a
              href="/cont/setari"
              style={{
                background: '#C9A84C', color: '#0F0F0F', fontWeight: 700,
                borderRadius: 8, padding: '8px 16px', fontSize: 13, textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Adaugă data →
            </a>
          </div>
        )}

        {/* ── Welcome bonus banner ─────────────────────────────────────────── */}
        {welcomeBonusActive && walletBalance > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(16,185,129,0.03) 100%)',
            border: '1px solid rgba(52,211,153,0.35)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>🎁</span>
              <h3 style={{ color: '#34d399', fontSize: 14, fontWeight: 700 }}>
                Credit de bun venit activ!
              </h3>
            </div>
            <p style={{ color: '#9A9490', fontSize: 13 }}>
              Ai <strong style={{ color: '#34d399' }}>{walletBalance.toFixed(2)} RON</strong> credit de bun venit în portofel.
              Folosibil pe comenzi de minimum <strong style={{ color: '#F0EDE6' }}>{welcomeBonusMinOrderValue} RON</strong>.
              {walletExpiresAt && (
                <> Expiră pe <strong style={{ color: '#F0EDE6' }}>{fmt(walletExpiresAt)}</strong>.</>
              )}
            </p>
          </div>
        )}

        {/* ── Level 3 → Level 4 progress (Level 3 only) ────────────────────── */}
        {currentLevel === 3 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(167,139,250,0.07) 0%, rgba(139,92,246,0.03) 100%)',
            border: '1px solid rgba(167,139,250,0.25)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>⭐</span>
              <h3 style={{ color: '#a78bfa', fontSize: 14, fontWeight: 700 }}>
                Progres spre Silver (Nivel 4)
              </h3>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: 999,
              height: 8, overflow: 'hidden', marginBottom: 6,
            }}>
              <div style={{
                width: `${Math.min(100, (totalReferrals / upgradeReferralsRequired) * 100)}%`,
                height: '100%', borderRadius: 999,
                background: 'linear-gradient(90deg, #a78bfa, #7c3aed)',
                transition: 'width 0.8s ease',
              }} />
            </div>
            <p style={{ color: '#9A9490', fontSize: 12, marginBottom: 4 }}>
              <strong style={{ color: '#a78bfa' }}>{totalReferrals}</strong>
              {' / '}{upgradeReferralsRequired} referrali cu comandă finalizată
            </p>
            <p style={{ color: '#666', fontSize: 11 }}>
              Invită {upgradeReferralsRequired - totalReferrals > 0 ? `${upgradeReferralsRequired - totalReferrals} prieten${upgradeReferralsRequired - totalReferrals === 1 ? '' : 'i'} mai` : ''} pentru a debloca Nivel 4 — Silver și a câștiga 20% cashback din comenzile lor!
            </p>
          </div>
        )}

        {/* ── Level 4 status ────────────────────────────────────────────────── */}
        {currentLevel >= 4 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(139,92,246,0.03) 100%)',
            border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>⭐</span>
              <h3 style={{ color: '#a78bfa', fontSize: 16, fontWeight: 700 }}>Silver — Nivel 4</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div style={{
                background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: 10, padding: '10px 14px', flex: '1 0 140px',
              }}>
                <p style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>🤝 Referrali Activi</p>
                <p style={{ color: '#F0EDE6', fontSize: 18, fontWeight: 700 }}>{totalReferrals}</p>
              </div>
              <div style={{
                background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)',
                borderRadius: 10, padding: '10px 14px', flex: '1 0 140px',
              }}>
                <p style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>💰 Cashback Referral Total</p>
                <p style={{ color: '#F0EDE6', fontSize: 16, fontWeight: 700 }}>{referralCashbackEarned.toFixed(2)} RON</p>
              </div>
              <div style={{
                background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)',
                borderRadius: 10, padding: '10px 14px', flex: '1 0 140px',
              }}>
                <p style={{ color: '#FACC15', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>⚡ Cashback Personal</p>
                <p style={{ color: '#9A9490', fontSize: 11 }}>5% permanent</p>
              </div>
            </div>
            {referrals.length > 0 && (
              <div>
                <p style={{ color: '#555', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Referralii tăi
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {referrals.map((r) => (
                    <div key={r.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 8, padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div>
                        <span style={{ color: '#F0EDE6', fontSize: 13, fontWeight: 600 }}>{r.referredUserFirstName}</span>
                        <span style={{ marginLeft: 8 }}>
                          <ReferralStatusBadge status={r.status} />
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700 }}>
                          {r.totalCashbackEarned.toFixed(2)} RON câștigat
                        </p>
                        <p style={{ color: '#555', fontSize: 11 }}>
                          {r.referredOrdersCount}/3 comenzi
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Invite friends (all levels) ───────────────────────────────────── */}
        {referralCode && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(201,168,76,0.02) 100%)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 20, padding: '28px 24px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>🤝</span>
              <h2 style={{ color: '#F0EDE6', fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700 }}>
                Invită Prieteni
              </h2>
            </div>
            <p style={{ color: '#9A9490', fontSize: 13, marginBottom: 20 }}>
              Invită prieteni noi și câștigă <strong style={{ color: '#a78bfa' }}>20% cashback</strong> din primele lor 3 comenzi.
              {currentLevel < 4 && (
                <> La <strong style={{ color: '#a78bfa' }}>{upgradeReferralsRequired} referrali</strong> activi deblochezi automat <strong style={{ color: '#a78bfa' }}>Nivel 4 — Silver</strong>!</>
              )}
            </p>

            {/* Referral code box */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#555', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Codul tău de invitație
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: 22, fontWeight: 800,
                  color: '#C9A84C', letterSpacing: '0.1em',
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  borderRadius: 10, padding: '8px 20px',
                }}>
                  {referralCode}
                </span>
                <button
                  onClick={copyReferralCode}
                  style={{
                    background: referralCopied ? 'rgba(52,211,153,0.15)' : 'rgba(201,168,76,0.1)',
                    border: `1px solid ${referralCopied ? 'rgba(52,211,153,0.4)' : 'rgba(201,168,76,0.3)'}`,
                    color: referralCopied ? '#34d399' : '#C9A84C',
                    borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {referralCopied ? '✓ Copiat!' : 'Copiază'}
                </button>
              </div>
            </div>

            {/* Share buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button
                onClick={copyInviteLink}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#F0EDE6', borderRadius: 8, padding: '9px 16px', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                🔗 Copiază link invitație
              </button>
              {inviteLink && (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Hei! Înregistrează-te la River's Lounge cu codul meu ${referralCode} și primești 30 RON credit cadou + acces direct la Nivel 2: ${inviteLink}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)',
                    color: '#25D366', borderRadius: 8, padding: '9px 16px', fontSize: 12,
                    fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  WhatsApp
                </a>
              )}
              {inviteLink && (
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(59,89,152,0.1)', border: '1px solid rgba(59,89,152,0.3)',
                    color: '#6B9ADF', borderRadius: 8, padding: '9px 16px', fontSize: 12,
                    fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  Facebook
                </a>
              )}
            </div>

            <p style={{ color: '#444', fontSize: 11, marginTop: 16 }}>
              Prietenul tău primește 30 RON credit + Nivel 2 direct la înregistrare. Tu câștigi 20% cashback din primele lui 3 comenzi (max 400 RON/comandă).
            </p>
          </div>
        )}

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
                Câștigă{' '}
                <strong style={{ color: '#C9A84C' }}>
                  cashback {level3CashbackBoostLeft > 0 ? '5%' : currentLevel >= 3 ? '3%' : '3%'}
                  {level3CashbackBoostLeft > 0 && ' (boost activ)'}
                </strong>
                {' '}pe fiecare comandă livrată și acumulează credit pentru comenzi viitoare.
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
                      {level.level === 3 && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: '#FACC15' }}>· ⚡ livrare prioritară</span>
                      )}
                      {level.level === 4 && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: '#a78bfa' }}>· ⭐ 20% cashback referral</span>
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
