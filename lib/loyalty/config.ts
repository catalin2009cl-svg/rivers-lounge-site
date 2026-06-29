import { prisma } from '@/lib/prisma';
import type { LoyaltyConfig } from './types';

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  enabled: true,
  level1: {
    enabled: true,
    ordersRequired: 9,
    freeOrderMaxValue: 200,
    rewardValidityDays: 30,
  },
  level2: {
    enabled: true,
    cashbackPercent: 3,
    walletExpiryDays: 30,
  },
  level3: {
    enabled: true,
    cashbackThreshold30Days: 50,
    walletExpiryDays: 90,
    bonusChoiceWindowHours: 24,
    cashbackBoostPercent: 5,
    cashbackBoostOrders: 10,
  },
  level4: {
    enabled: true,
    upgradeReferralsRequired: 2,
    referralCashbackPercent: 20,
    referralCashbackMaxOrderValue: 400,
    referralCashbackMaxOrders: 3,
    welcomeBonusEnabled: true,
    welcomeBonusCreditAmount: 30,
    welcomeBonusMinOrderValue: 60,
    welcomeBonusExpiryDays: 3,
  },
  levels: [
    { level: 1, minOrders: 0,   maxOrders: 9,   name: 'Client Nou' },
    { level: 2, minOrders: 10,  maxOrders: 19,  name: 'Client Fidel' },
    { level: 3, minOrders: 20,  maxOrders: 34,  name: 'Client Premium' },
    { level: 4, minOrders: 35,  maxOrders: 54,  name: 'Silver' },
    { level: 5, minOrders: 55,  maxOrders: 79,  name: 'Gold' },
    { level: 6, minOrders: 80,  maxOrders: 119, name: 'Platinum' },
    { level: 7, minOrders: 120, maxOrders: 199, name: 'Diamond' },
    { level: 8, minOrders: 200, maxOrders: null, name: 'VIP Elite' },
  ],
};

export async function getLoyaltyConfig(): Promise<LoyaltyConfig> {
  const row = await prisma.siteSettings.findUnique({ where: { key: 'loyalty-config' } });
  if (!row) return DEFAULT_LOYALTY_CONFIG;
  const saved = row.value as unknown as Partial<LoyaltyConfig>;
  return {
    ...DEFAULT_LOYALTY_CONFIG,
    ...saved,
    level1: { ...DEFAULT_LOYALTY_CONFIG.level1, ...(saved.level1 ?? {}) },
    level2: { ...DEFAULT_LOYALTY_CONFIG.level2, ...(saved.level2 ?? {}) },
    level3: { ...DEFAULT_LOYALTY_CONFIG.level3, ...(saved.level3 ?? {}) },
    level4: { ...DEFAULT_LOYALTY_CONFIG.level4, ...(saved.level4 ?? {}) },
  };
}

export async function saveLoyaltyConfig(config: LoyaltyConfig): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { key: 'loyalty-config' },
    update: { value: config as never },
    create: { key: 'loyalty-config', value: config as never },
  });
}

export function calculateLevel(totalOrders: number, levels: LoyaltyConfig['levels']): number {
  const sorted = [...levels].sort((a, b) => b.minOrders - a.minOrders);
  for (const level of sorted) {
    if (totalOrders >= level.minOrders) return level.level;
  }
  return 1;
}

export function getLevelInfo(levelNumber: number, levels: LoyaltyConfig['levels']) {
  return levels.find((l) => l.level === levelNumber) ?? levels[0];
}

export function getNextLevel(currentLevel: number, levels: LoyaltyConfig['levels']) {
  return levels.find((l) => l.level === currentLevel + 1) ?? null;
}
