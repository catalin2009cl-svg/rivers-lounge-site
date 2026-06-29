import Link from 'next/link';
import type { WalletTransactionSummary } from '@/lib/loyalty/types';

interface WalletWidgetProps {
  walletBalance: number;
  walletExpiresAt: string | null;
  recentWalletTransactions: WalletTransactionSummary[];
}

function txIcon(type: string): string {
  switch (type) {
    case 'CASHBACK_EARNED':
    case 'BOOST_CASHBACK': return '💰';
    case 'BIRTHDAY_BONUS': return '🎂';
    case 'REFERRAL_CASHBACK':
    case 'REFERRAL_WELCOME':
    case 'MANUAL_CREDIT': return '⭐';
    case 'CREDIT_USED': return '💳';
    default: return '💰';
  }
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

export function WalletWidget({ walletBalance, walletExpiresAt, recentWalletTransactions }: WalletWidgetProps) {
  const hasBalance = walletBalance > 0;
  const recent = recentWalletTransactions.slice(0, 5);
  const daysLeft = walletExpiresAt ? daysUntil(walletExpiresAt) : null;
  const expiringSoon = daysLeft !== null && daysLeft <= 7;

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: 'rgba(201,168,76,0.04)', borderColor: 'rgba(201,168,76,0.25)' }}
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">💳</span>
        <span className="text-xs font-bold text-primary uppercase tracking-widest">Portofelul Meu</span>
      </div>

      {hasBalance ? (
        <>
          {/* Balance */}
          <div className="text-center mb-5">
            <div className="font-serif font-bold leading-none" style={{ fontSize: 44, color: '#C9A84C' }}>
              {walletBalance.toFixed(2)}
              <span className="text-2xl ml-2 font-sans font-semibold" style={{ color: '#C9A84C' }}>
                RON
              </span>
            </div>

            {walletExpiresAt && (
              <div className="mt-2">
                {expiringSoon ? (
                  <span className="text-sm font-semibold" style={{ color: '#F97316' }}>
                    ⚠️ Expiră în {daysLeft} {daysLeft === 1 ? 'zi' : 'zile'}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {'Valabil până pe '}
                    {new Date(walletExpiresAt).toLocaleDateString('ro-RO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Transaction list */}
          {recent.length > 0 && (
            <div
              className="rounded-xl overflow-hidden mb-4"
              style={{ border: '1px solid rgba(201,168,76,0.12)', background: 'rgba(0,0,0,0.18)' }}
            >
              {recent.map((tx, i) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    borderBottom:
                      i < recent.length - 1 ? '1px solid rgba(201,168,76,0.08)' : undefined,
                  }}
                >
                  <span className="text-base shrink-0">{txIcon(tx.type)}</span>
                  <span
                    className="text-xs text-muted-foreground flex-1 min-w-0 truncate"
                    title={tx.description ?? ''}
                  >
                    {tx.description ?? tx.type}
                  </span>
                  <span
                    className="text-xs font-bold shrink-0 ml-2 tabular-nums"
                    style={{ color: tx.amount >= 0 ? '#4ade80' : '#f87171' }}
                  >
                    {tx.amount >= 0 ? '+' : ''}
                    {tx.amount.toFixed(2)} RON
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2 hidden sm:block tabular-nums">
                    {new Date(tx.createdAt).toLocaleDateString('ro-RO', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/cont/fidelizare"
            className="flex items-center justify-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-2 transition-colors"
          >
            Vezi istoricul complet →
          </Link>
        </>
      ) : (
        /* Empty state */
        <div className="text-center py-3">
          <p className="text-sm text-muted-foreground mb-3">Nu ai credit disponibil</p>
          <Link
            href="/cont/fidelizare"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-2"
          >
            Cum câștig credit? →
          </Link>
        </div>
      )}
    </div>
  );
}
