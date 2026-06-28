export interface LoyaltyLevel {
  level: number;
  minOrders: number;
  maxOrders: number | null;
  name: string;
}

export interface LoyaltyLevel1Config {
  enabled: boolean;
  ordersRequired: number;
  freeOrderMaxValue: number;
  rewardValidityDays: number;
}

export interface LoyaltyLevel2Config {
  enabled: boolean;
  cashbackPercent: number;
  walletExpiryDays: number;
}

export interface LoyaltyConfig {
  enabled: boolean;
  level1: LoyaltyLevel1Config;
  level2: LoyaltyLevel2Config;
  levels: LoyaltyLevel[];
}

export interface ActiveReward {
  id: string;
  rewardType: string;
  rewardValue: number;
  expiresAt: string | null;
  levelId: number | null;
}

export interface WalletTransactionSummary {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  sourceOrderId: string | null;
  usedOnOrderId: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface LoyaltyProfileSummary {
  id: string;
  userId: string;
  totalCompletedOrders: number;
  currentLevel: number;
  currentLevelName: string;
  nextLevelName: string | null;
  ordersToNextLevel: number | null;
  totalSpentEligible: number;
  firstCompletedOrderAt: string | null;
  lastCompletedOrderAt: string | null;
  activeReward: ActiveReward | null;
  walletBalance: number;
  walletExpiresAt: string | null;
  recentWalletTransactions: WalletTransactionSummary[];
}

export type RewardStatusValue = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
