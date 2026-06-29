'use client';

import { useState, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Settings, Users, Gift, BarChart3, XCircle, Download, Share2 } from 'lucide-react';
import type { LoyaltyConfig } from '@/lib/loyalty/types';

// ── Types ────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  currentLevel: number;
  totalCompletedOrders: number;
  firstCompletedOrderAt: string | null;
  hasActiveReward: boolean;
  walletBalance: number;
  walletExpiresAt: string | null;
  priorityDelivery: boolean;
  level3BonusChoice: string | null;
  level3CashbackBoostLeft: number;
  totalCashbackEarned: number;
  totalReferrals: number;
  referralCashbackEarned: number;
}

interface ReferralAdminRow {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
  referrerCode: string | null;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  referredUserRegisteredAt: string;
  status: string;
  referredOrdersCount: number;
  totalCashbackEarned: number;
  createdAt: string;
}

interface RewardRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rewardType: string;
  rewardValue: number;
  status: string;
  levelId: number | null;
  issuedAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  usedOnOrderId: string | null;
  triggerOrderId: string | null;
}

interface Stats {
  totalIssued: number;
  totalUsed: number;
  totalExpired: number;
  totalValueIssued: number;
  totalValueRedeemed: number;
}

interface Props {
  config: LoyaltyConfig;
  users: UserRow[];
  rewards: RewardRow[];
  stats: Stats;
  canEdit: boolean;
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE:    { label: 'Activă',   className: 'bg-green-100 text-green-800 border-green-200' },
    USED:      { label: 'Folosită', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    EXPIRED:   { label: 'Expirată', className: 'bg-gray-100 text-gray-600 border-gray-200' },
    CANCELLED: { label: 'Anulată',  className: 'bg-red-100 text-red-800 border-red-200' },
  };
  const cfg = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Main component ────────────────────────────────────────────────────────────

export function LoyaltyAdminClient({ config: initialConfig, users, rewards: initialRewards, stats, canEdit }: Props) {
  const [config, setConfig] = useState<LoyaltyConfig>(initialConfig);
  const [rewards, setRewards] = useState<RewardRow[]>(initialRewards);
  const [referrals, setReferrals] = useState<ReferralAdminRow[] | null>(null);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [referralStatusFilter, setReferralStatusFilter] = useState('all');
  const [saving, startSave] = useTransition();

  // Settings state
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantValue, setGrantValue] = useState('');
  const [grantDays, setGrantDays] = useState('30');
  const [grantNote, setGrantNote] = useState('');
  const [granting, startGrant] = useTransition();

  // ── Save settings ──────────────────────────────────────────────────────────
  function handleSaveSettings() {
    startSave(async () => {
      const res = await fetch('/api/admin/loyalty/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast.success('Setări salvate cu succes.');
      } else {
        toast.error('Eroare la salvarea setărilor.');
      }
    });
  }

  // ── Cancel reward ──────────────────────────────────────────────────────────
  function handleCancel(rewardId: string) {
    startSave(async () => {
      const res = await fetch(`/api/admin/loyalty/rewards/${rewardId}/cancel`, { method: 'POST' });
      if (res.ok) {
        setRewards((prev) => prev.map((r) => r.id === rewardId ? { ...r, status: 'CANCELLED' } : r));
        toast.success('Recompensă anulată.');
      } else {
        toast.error('Eroare la anulare.');
      }
    });
  }

  // ── Grant reward ───────────────────────────────────────────────────────────
  function handleGrant() {
    if (!grantUserId || !grantValue) return;
    startGrant(async () => {
      const res = await fetch('/api/admin/loyalty/rewards/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: grantUserId,
          rewardType: 'FREE_ORDER',
          rewardValue: parseFloat(grantValue),
          validityDays: parseInt(grantDays),
          note: grantNote,
        }),
      });
      if (res.ok) {
        toast.success('Recompensă acordată.');
        setGrantDialogOpen(false);
        setGrantValue('');
        setGrantNote('');
      } else {
        const data = await res.json() as { error?: string };
        toast.error(data.error ?? 'Eroare la acordare.');
      }
    });
  }

  // ── CSV export ─────────────────────────────────────────────────────────────
  function exportCSV() {
    const headers = ['Utilizator', 'Email', 'Tip', 'Valoare', 'Status', 'Emis', 'Expiră', 'Folosit pe'];
    const rows = rewards.map((r) => [
      r.userName, r.userEmail, r.rewardType, r.rewardValue.toString(),
      r.status, fmt(r.issuedAt), fmt(r.expiresAt), r.usedOnOrderId ?? '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recompense-loialitate-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredRewards = statusFilter === 'all' ? rewards : rewards.filter((r) => r.status === statusFilter);

  async function loadReferrals() {
    if (referrals !== null) return;
    setReferralsLoading(true);
    try {
      const res = await fetch('/api/admin/loyalty/referrals');
      if (res.ok) {
        const data = await res.json() as { referrals: ReferralAdminRow[] };
        setReferrals(data.referrals);
      }
    } finally {
      setReferralsLoading(false);
    }
  }

  const filteredReferrals = (referrals ?? []).filter(
    (r) => referralStatusFilter === 'all' || r.status === referralStatusFilter
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Program Loialitate</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestionează recompensele și nivelurile clienților Rivers Lounge.</p>
      </div>

      <Tabs defaultValue="settings">
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Setări
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Clienți ({users.length})
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="h-4 w-4" /> Recompense ({rewards.length})
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2" onClick={loadReferrals}>
            <Share2 className="h-4 w-4" /> Referrali
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Statistici
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Settings ─────────────────────────────────────────────── */}
        <TabsContent value="settings" className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <h2 className="font-semibold text-foreground">Configurare generală</h2>

            <div className="flex items-center gap-3">
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(v) => setConfig((c) => ({ ...c, enabled: v }))}
                disabled={!canEdit}
              />
              <Label htmlFor="enabled">Program de loialitate activ</Label>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Nivel 1 — Comandă gratuită</h3>
              <div className="flex items-center gap-3 mb-4">
                <Switch
                  id="l1-enabled"
                  checked={config.level1.enabled}
                  onCheckedChange={(v) => setConfig((c) => ({ ...c, level1: { ...c.level1, enabled: v } }))}
                  disabled={!canEdit}
                />
                <Label htmlFor="l1-enabled">Recompensă Nivel 1 activă</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Comenzi necesare</Label>
                  <Input
                    type="number" min={1}
                    value={config.level1.ordersRequired}
                    onChange={(e) => setConfig((c) => ({ ...c, level1: { ...c.level1, ordersRequired: parseInt(e.target.value) || 9 } }))}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Valoare maximă (RON)</Label>
                  <Input
                    type="number" min={1}
                    value={config.level1.freeOrderMaxValue}
                    onChange={(e) => setConfig((c) => ({ ...c, level1: { ...c.level1, freeOrderMaxValue: parseFloat(e.target.value) || 200 } }))}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Valabilitate (zile)</Label>
                  <Input
                    type="number" min={1}
                    value={config.level1.rewardValidityDays}
                    onChange={(e) => setConfig((c) => ({ ...c, level1: { ...c.level1, rewardValidityDays: parseInt(e.target.value) || 30 } }))}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Nivel 2 — Cashback</h3>
              <div className="flex items-center gap-3 mb-4">
                <Switch
                  id="l2-enabled"
                  checked={config.level2.enabled}
                  onCheckedChange={(v) => setConfig((c) => ({ ...c, level2: { ...c.level2, enabled: v } }))}
                  disabled={!canEdit}
                />
                <Label htmlFor="l2-enabled">Cashback Nivel 2 activ</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Procent cashback (%)</Label>
                  <Input
                    type="number" min={0} max={100} step={0.5}
                    value={config.level2.cashbackPercent}
                    onChange={(e) => setConfig((c) => ({ ...c, level2: { ...c.level2, cashbackPercent: parseFloat(e.target.value) || 3 } }))}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Expirare credit portofel (zile)</Label>
                  <Input
                    type="number" min={1}
                    value={config.level2.walletExpiryDays}
                    onChange={(e) => setConfig((c) => ({ ...c, level2: { ...c.level2, walletExpiryDays: parseInt(e.target.value) || 30 } }))}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Nivel 3 — Client Premium</h3>
              <div className="flex items-center gap-3 mb-4">
                <Switch
                  id="l3-enabled"
                  checked={config.level3.enabled}
                  onCheckedChange={(v) => setConfig((c) => ({ ...c, level3: { ...c.level3, enabled: v } }))}
                  disabled={!canEdit}
                />
                <Label htmlFor="l3-enabled">Upgrade automat Nivel 3 activ</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Prag cashback 30 zile (RON)</Label>
                  <Input
                    type="number" min={1}
                    value={config.level3.cashbackThreshold30Days}
                    onChange={(e) => setConfig((c) => ({ ...c, level3: { ...c.level3, cashbackThreshold30Days: parseFloat(e.target.value) || 50 } }))}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Expirare portofel Nivel 3 (zile)</Label>
                  <Input
                    type="number" min={1}
                    value={config.level3.walletExpiryDays}
                    onChange={(e) => setConfig((c) => ({ ...c, level3: { ...c.level3, walletExpiryDays: parseInt(e.target.value) || 90 } }))}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Fereastră alegere bonus (ore)</Label>
                  <Input
                    type="number" min={1}
                    value={config.level3.bonusChoiceWindowHours}
                    onChange={(e) => setConfig((c) => ({ ...c, level3: { ...c.level3, bonusChoiceWindowHours: parseInt(e.target.value) || 24 } }))}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Procent cashback boost (%)</Label>
                  <Input
                    type="number" min={1} max={100} step={0.5}
                    value={config.level3.cashbackBoostPercent}
                    onChange={(e) => setConfig((c) => ({ ...c, level3: { ...c.level3, cashbackBoostPercent: parseFloat(e.target.value) || 5 } }))}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Comenzi boost cashback</Label>
                  <Input
                    type="number" min={1}
                    value={config.level3.cashbackBoostOrders}
                    onChange={(e) => setConfig((c) => ({ ...c, level3: { ...c.level3, cashbackBoostOrders: parseInt(e.target.value) || 10 } }))}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Nivel 4 — Silver (Sistem Referral)</h3>
              <div className="flex items-center gap-3 mb-4">
                <Switch
                  id="l4-enabled"
                  checked={config.level4.enabled}
                  onCheckedChange={(v) => setConfig((c) => ({ ...c, level4: { ...c.level4, enabled: v } }))}
                  disabled={!canEdit}
                />
                <Label htmlFor="l4-enabled">Sistem referral Nivel 4 activ</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Referrali necesari pentru Nivel 4</Label>
                  <Input
                    type="number" min={1}
                    value={config.level4.upgradeReferralsRequired}
                    onChange={(e) => setConfig((c) => ({ ...c, level4: { ...c.level4, upgradeReferralsRequired: parseInt(e.target.value) || 2 } }))}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Cashback referral (%)</Label>
                  <Input
                    type="number" min={1} max={100} step={1}
                    value={config.level4.referralCashbackPercent}
                    onChange={(e) => setConfig((c) => ({ ...c, level4: { ...c.level4, referralCashbackPercent: parseFloat(e.target.value) || 20 } }))}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Valoare max. comandă referral (RON)</Label>
                  <Input
                    type="number" min={1}
                    value={config.level4.referralCashbackMaxOrderValue}
                    onChange={(e) => setConfig((c) => ({ ...c, level4: { ...c.level4, referralCashbackMaxOrderValue: parseFloat(e.target.value) || 400 } }))}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Max. comenzi cu cashback/referral</Label>
                  <Input
                    type="number" min={1}
                    value={config.level4.referralCashbackMaxOrders}
                    onChange={(e) => setConfig((c) => ({ ...c, level4: { ...c.level4, referralCashbackMaxOrders: parseInt(e.target.value) || 3 } }))}
                    disabled={!canEdit}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <Switch
                  id="l4-welcome"
                  checked={config.level4.welcomeBonusEnabled}
                  onCheckedChange={(v) => setConfig((c) => ({ ...c, level4: { ...c.level4, welcomeBonusEnabled: v } }))}
                  disabled={!canEdit}
                />
                <Label htmlFor="l4-welcome">Bonus bun venit pentru utilizatori invitați</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Credit bun venit (RON)</Label>
                  <Input
                    type="number" min={0}
                    value={config.level4.welcomeBonusCreditAmount}
                    onChange={(e) => setConfig((c) => ({ ...c, level4: { ...c.level4, welcomeBonusCreditAmount: parseFloat(e.target.value) || 30 } }))}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Valoare minimă comandă (RON)</Label>
                  <Input
                    type="number" min={0}
                    value={config.level4.welcomeBonusMinOrderValue}
                    onChange={(e) => setConfig((c) => ({ ...c, level4: { ...c.level4, welcomeBonusMinOrderValue: parseFloat(e.target.value) || 60 } }))}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Expirare credit bun venit (zile)</Label>
                  <Input
                    type="number" min={1}
                    value={config.level4.welcomeBonusExpiryDays}
                    onChange={(e) => setConfig((c) => ({ ...c, level4: { ...c.level4, welcomeBonusExpiryDays: parseInt(e.target.value) || 3 } }))}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Niveluri</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-3 text-xs text-muted-foreground font-medium">Nivel</th>
                      <th className="py-2 pr-3 text-xs text-muted-foreground font-medium">Nume</th>
                      <th className="py-2 pr-3 text-xs text-muted-foreground font-medium">Min. comenzi</th>
                      <th className="py-2 text-xs text-muted-foreground font-medium">Max. comenzi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.levels.map((level, i) => (
                      <tr key={level.level} className="border-b border-border/50 last:border-0">
                        <td className="py-2 pr-3 text-muted-foreground">{level.level}</td>
                        <td className="py-2 pr-3">
                          <Input
                            value={level.name}
                            onChange={(e) => setConfig((c) => ({
                              ...c,
                              levels: c.levels.map((l, j) => j === i ? { ...l, name: e.target.value } : l),
                            }))}
                            disabled={!canEdit}
                            className="h-7 text-sm"
                          />
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">{level.minOrders}</td>
                        <td className="py-2 text-muted-foreground">{level.maxOrders ?? '∞'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {canEdit && (
              <Button onClick={handleSaveSettings} disabled={saving} className="bg-primary text-primary-foreground">
                {saving ? 'Se salvează...' : 'Salvează setările'}
              </Button>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 2: Customers ────────────────────────────────────────────── */}
        <TabsContent value="customers">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/30">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Client</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Nivel</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Comenzi</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Prima comandă</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Recompensă</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Portofel</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">Niciun client cu profil de loialitate.</td></tr>
                  )}
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-xs">Nivel {u.currentLevel}</Badge>
                          {u.currentLevel >= 4 && (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.4)' }}>
                              ⭐ Silver
                            </span>
                          )}
                          {u.priorityDelivery && u.currentLevel < 4 && (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(234,179,8,0.15)', color: '#FACC15', border: '1px solid rgba(234,179,8,0.4)' }}>
                              ⚡
                            </span>
                          )}
                        </div>
                        {u.level3BonusChoice && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {u.level3BonusChoice === 'WALLET_DOUBLE' ? '💳 Portofel dublat' : '🚀 Boost 5%'}
                            {u.level3CashbackBoostLeft > 0 && ` (${u.level3CashbackBoostLeft} rămase)`}
                          </p>
                        )}
                        {u.totalReferrals > 0 && (
                          <p className="text-xs mt-0.5" style={{ color: '#a78bfa' }}>
                            🤝 {u.totalReferrals} referrali · {u.referralCashbackEarned.toFixed(2)} RON
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{u.totalCompletedOrders}</td>
                      <td className="py-3 px-4 text-muted-foreground">{fmt(u.firstCompletedOrderAt)}</td>
                      <td className="py-3 px-4">
                        {u.hasActiveReward ? (
                          <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Da</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {u.walletBalance > 0 ? (
                          <div>
                            <span className="text-xs font-semibold text-primary">{u.walletBalance.toFixed(2)} RON</span>
                            {u.walletExpiresAt && (
                              <p className="text-xs text-muted-foreground">
                                exp. {fmt(u.walletExpiresAt)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setSelectedUser(u);
                              setGrantUserId(u.userId);
                              setGrantDialogOpen(true);
                            }}
                          >
                            Acordă recompensă
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 3: Rewards ──────────────────────────────────────────────── */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2 flex-wrap">
              {['all', 'ACTIVE', 'USED', 'EXPIRED', 'CANCELLED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                    statusFilter === s
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                  }`}
                >
                  {s === 'all' ? 'Toate' : s === 'ACTIVE' ? 'Active' : s === 'USED' ? 'Folosite' : s === 'EXPIRED' ? 'Expirate' : 'Anulate'}
                </button>
              ))}
            </div>
            <div className="ml-auto">
              <Button size="sm" variant="outline" className="gap-2 text-xs h-8" onClick={exportCSV}>
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/30">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Client</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Tip</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Valoare</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Emis</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Expiră</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRewards.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">Nicio recompensă.</td></tr>
                  )}
                  {filteredRewards.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">{r.userName}</p>
                        <p className="text-xs text-muted-foreground">{r.userEmail}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono text-muted-foreground">{r.rewardType}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">{r.rewardValue.toFixed(0)} RON</td>
                      <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                      <td className="py-3 px-4 text-muted-foreground">{fmt(r.issuedAt)}</td>
                      <td className="py-3 px-4 text-muted-foreground">{fmt(r.expiresAt)}</td>
                      <td className="py-3 px-4">
                        {canEdit && r.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleCancel(r.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Anulează recompensa"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 4: Referrals ────────────────────────────────────────────── */}
        <TabsContent value="referrals" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2 flex-wrap">
              {(['all', 'PENDING', 'ACTIVE', 'COMPLETED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setReferralStatusFilter(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                    referralStatusFilter === s
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                  }`}
                >
                  {s === 'all' ? 'Toate' : s === 'PENDING' ? 'Pending' : s === 'ACTIVE' ? 'Active' : 'Completate'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              {referralsLoading ? (
                <div className="py-12 text-center text-muted-foreground text-sm">Se încarcă...</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-secondary/30">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Referrer</th>
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Invitat</th>
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Comenzi (X/3)</th>
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Cashback câștigat</th>
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredReferrals.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                        {referrals === null ? 'Apasă tab-ul pentru a încărca datele.' : 'Niciun referral găsit.'}
                      </td></tr>
                    )}
                    {filteredReferrals.map((r) => (
                      <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium text-foreground">{r.referrerName}</p>
                          <p className="text-xs text-muted-foreground">{r.referrerEmail}</p>
                          {r.referrerCode && (
                            <p className="text-xs font-mono" style={{ color: '#C9A84C' }}>{r.referrerCode}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-foreground">{r.referredUserName}</p>
                          <p className="text-xs text-muted-foreground">{r.referredUserEmail}</p>
                          <p className="text-xs text-muted-foreground">{fmt(r.referredUserRegisteredAt)}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            r.status === 'ACTIVE'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : r.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {r.status === 'PENDING' ? 'Pending' : r.status === 'ACTIVE' ? 'Activ' : 'Complet'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{r.referredOrdersCount} / 3</td>
                        <td className="py-3 px-4 font-semibold" style={{ color: '#a78bfa' }}>
                          {r.totalCashbackEarned.toFixed(2)} RON
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{fmt(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 5: Statistics ────────────────────────────────────────────── */}
        <TabsContent value="stats">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total emise', value: stats.totalIssued.toString(), color: 'text-foreground' },
              { label: 'Folosite', value: stats.totalUsed.toString(), color: 'text-blue-600' },
              { label: 'Expirate', value: stats.totalExpired.toString(), color: 'text-gray-500' },
              { label: 'Valoare emisă', value: `${stats.totalValueIssued.toFixed(0)} RON`, color: 'text-primary' },
              { label: 'Valoare răscumpărată', value: `${stats.totalValueRedeemed.toFixed(0)} RON`, color: 'text-green-600' },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-5 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Grant reward dialog ─────────────────────────────────────────────── */}
      <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acordă recompensă manuală</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <p className="text-sm text-muted-foreground">
              Client: <strong>{selectedUser.name}</strong> ({selectedUser.email})
            </p>
          )}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Valoare recompensă (RON)</Label>
              <Input
                type="number" min={1}
                placeholder="Ex: 100"
                value={grantValue}
                onChange={(e) => setGrantValue(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Valabilitate (zile)</Label>
              <Input
                type="number" min={1}
                value={grantDays}
                onChange={(e) => setGrantDays(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Notă internă (opțional)</Label>
              <Input
                placeholder="Motiv acordare..."
                value={grantNote}
                onChange={(e) => setGrantNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialogOpen(false)}>Anulează</Button>
            <Button
              onClick={handleGrant}
              disabled={granting || !grantValue}
              className="bg-primary text-primary-foreground"
            >
              {granting ? 'Se acordă...' : 'Acordă recompensa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
