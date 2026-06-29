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

export interface LoyaltyLevel3Config {
  enabled: boolean;
  cashbackThreshold30Days: number;
  walletExpiryDays: number;
  bonusChoiceWindowHours: number;
  cashbackBoostPercent: number;
  cashbackBoostOrders: number;
}

export interface LoyaltyLevel4Config {
  enabled: boolean;
  upgradeReferralsRequired: number;
  referralCashbackPercent: number;
  referralCashbackMaxOrderValue: number;
  referralCashbackMaxOrders: number;
  welcomeBonusEnabled: boolean;
  welcomeBonusCreditAmount: number;
  welcomeBonusMinOrderValue: number;
  welcomeBonusExpiryDays: number;
}

export interface LoyaltyConfig {
  enabled: boolean;
  level1: LoyaltyLevel1Config;
  level2: LoyaltyLevel2Config;
  level3: LoyaltyLevel3Config;
  level4: LoyaltyLevel4Config;
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

export interface ReferralSummary {
  id: string;
  referredUserFirstName: string;
  status: string;
  referredOrdersCount: number;
  totalCashbackEarned: number;
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
  totalCashbackEarned: number;
  cashbackLast30Days: number;
  level3BonusChoice: string | null;
  level3BonusExpiresAt: string | null;
  level3CashbackBoostLeft: number;
  priorityDelivery: boolean;
  totalReferrals: number;
  referralCashbackEarned: number;
  welcomeBonusActive: boolean;
  referralCode: string | null;
  referrals: ReferralSummary[];
}

export type RewardStatusValue = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
