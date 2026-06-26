import type { User } from '@/lib/server-data';

export const RETENTION_RULES = {
  inactiveNoOrders: { days: 365, label: '1 an (fără comenzi)' },
  inactiveWithOrders: { days: 730, label: '2 ani (cu comenzi)' },
  notifyBeforeDays: 30,
};

export interface RetentionCheckResult {
  userId: string;
  name: string;
  email: string;
  lastActivityAt: string;
  daysSinceActivity: number;
  totalOrders: number;
  status: 'active' | 'warn_soon' | 'notify_pending' | 'eligible_deletion';
  deleteAfter: string;
  daysUntilDeletion: number;
  retentionNotifiedAt?: string;
}

export function checkUserRetention(user: User): RetentionCheckResult {
  const lastActivity = new Date(user.lastActivityAt || user.createdAt);
  const now = new Date();
  const daysSince = Math.floor(
    (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );

  const maxDays =
    user.totalOrders > 0
      ? RETENTION_RULES.inactiveWithOrders.days
      : RETENTION_RULES.inactiveNoOrders.days;

  const daysUntilDeletion = maxDays - daysSince;
  const deleteAfter = new Date(
    lastActivity.getTime() + maxDays * 24 * 60 * 60 * 1000
  );

  let status: RetentionCheckResult['status'];
  if (daysUntilDeletion > RETENTION_RULES.notifyBeforeDays) {
    status = 'active';
  } else if (daysUntilDeletion > 0) {
    status = user.retentionNotifiedAt ? 'notify_pending' : 'warn_soon';
  } else {
    status = 'eligible_deletion';
  }

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    lastActivityAt: user.lastActivityAt || user.createdAt,
    daysSinceActivity: daysSince,
    totalOrders: user.totalOrders || 0,
    status,
    deleteAfter: deleteAfter.toISOString(),
    daysUntilDeletion,
    retentionNotifiedAt: user.retentionNotifiedAt,
  };
}
