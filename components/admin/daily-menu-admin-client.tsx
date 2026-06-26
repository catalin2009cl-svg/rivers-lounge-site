'use client';

import { useState, useTransition } from 'react';
import { Save, Loader2, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { updateDailyMenu, toggleDailyMenu } from '@/lib/actions/settings';
import { DailyMenuBanner } from '@/components/daily-menu/daily-menu-banner';
import type { DailyMenuConfig, DailyMenuType } from '@/lib/server-data';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initialConfig: DailyMenuConfig;
}

const DAYS = [
  { key: 'monday',    label: 'Luni' },
  { key: 'tuesday',   label: 'Marți' },
  { key: 'wednesday', label: 'Miercuri' },
  { key: 'thursday',  label: 'Joi' },
  { key: 'friday',    label: 'Vineri' },
  { key: 'saturday',  label: 'Sâmbătă' },
  { key: 'sunday',    label: 'Duminică' },
] as const;

type DayKey = typeof DAYS[number]['key'];

// ── Component ─────────────────────────────────────────────────────────────────

export function DailyMenuAdminClient({ initialConfig }: Props) {
  const [config, setConfig] = useState<DailyMenuConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<'manual' | 'schedule'>('manual');
  const [saving, setSaving] = useState(false);
  const [togglePending, startToggleTransition] = useTransition();

  function setField<K extends keyof DailyMenuConfig>(key: K, value: DailyMenuConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function setDayField(day: DayKey, field: 'type' | 'title' | 'description' | 'price', value: string | number) {
    setConfig((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: { ...prev.schedule[day], [field]: value },
      },
    }));
  }

  function handleToggle(enabled: boolean) {
    setField('enabled', enabled);
    startToggleTransition(async () => {
      const res = await toggleDailyMenu(enabled);
      if (!res.success) {
        setField('enabled', !enabled);
        toast.error(res.error ?? 'Eroare la actualizare.');
      } else {
        toast.success(enabled ? 'Meniu zilei activat.' : 'Meniu zilei dezactivat.');
      }
    });
  }

  async function handleSave() {
    setSaving(true);
    const res = await updateDailyMenu(config);
    setSaving(false);
    if (res.success) {
      toast.success('Meniu zilei salvat și publicat.');
    } else {
      toast.error(res.error ?? 'Eroare la salvare.');
    }
  }

  const previewData = {
    type: config.type,
    title: config.title || 'Titlul ofertei zilei',
    description: config.description || 'Descriere ofertă',
    price: config.price || 0,
    oldPrice: config.oldPrice > 0 ? config.oldPrice : undefined,
    validUntil: config.validUntil || undefined,
    ctaLabel: config.ctaLabel || 'Comandă acum',
    ctaUrl: config.ctaUrl || '/comanda/checkout',
    showAsBanner: true,
    showAsPopup: false,
  };

  return (
    <div className="space-y-6">
      {/* Master toggle header */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              config.enabled ? 'bg-primary/10' : 'bg-gray-100 dark:bg-white/5'
            }`}>
              <ChefHat className={`h-5 w-5 ${config.enabled ? 'text-primary' : 'text-gray-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Meniu Zilei & Mic Dejun</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  config.enabled
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-500'
                }`}>
                  {config.enabled ? '● ACTIV' : '○ INACTIV'}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Configurează oferta zilnică afișată pe site ca banner sau popup
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {togglePending && <Loader2 className="h-3.5 w-3.5 text-gray-400 animate-spin" />}
            <Switch
              checked={config.enabled}
              onCheckedChange={handleToggle}
              disabled={togglePending}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#111] rounded-xl w-fit">
        {[
          { key: 'manual', label: '✏️ Manual (azi)' },
          { key: 'schedule', label: '📅 Program săptămânal' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'manual' | 'schedule')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Manual ──────────────────────────────────────────────────── */}
      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Form — 3/5 */}
          <div className="xl:col-span-3 space-y-5">
            {/* Type */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tip ofertă</p>
              <div className="flex gap-3">
                {([
                  { value: 'meniu-zilei', label: '🍽️ Meniu Zilei', desc: 'Prânz' },
                  { value: 'mic-dejun',   label: '☀️ Mic Dejun',   desc: 'Dimineața' },
                ] as const).map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setField('type', t.value)}
                    className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                      config.type === t.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div>{t.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content fields */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Conținut</p>
              <Field label="Titlu" required>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="ex: Meniu Complet de Prânz"
                  className={inputCls}
                />
              </Field>
              <Field label="Descriere">
                <textarea
                  value={config.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="ex: Ciorbă de văcuță, friptură de porc cu piure, salată și desert"
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Preț special (RON)" required>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={config.price || ''}
                    onChange={(e) => setField('price', Number(e.target.value))}
                    placeholder="45"
                    className={inputCls}
                  />
                </Field>
                <Field label="Preț normal / vechi (RON)">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={config.oldPrice || ''}
                    onChange={(e) => setField('oldPrice', Number(e.target.value))}
                    placeholder="65 (opțional, tăiat)"
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Valabil până la (oră)">
                <input
                  type="time"
                  value={config.validUntil}
                  onChange={(e) => setField('validUntil', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            {/* CTA */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Buton CTA</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Text buton">
                  <input
                    type="text"
                    value={config.ctaLabel}
                    onChange={(e) => setField('ctaLabel', e.target.value)}
                    placeholder="Comandă acum"
                    className={inputCls}
                  />
                </Field>
                <Field label="URL destinație">
                  <input
                    type="text"
                    value={config.ctaUrl}
                    onChange={(e) => setField('ctaUrl', e.target.value)}
                    placeholder="/comanda/checkout"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>

            {/* Display options */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Mod de afișare</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">Banner (bara fixă de sus)</p>
                    <p className="text-xs text-gray-400">Apare sub header, pe toată lățimea site-ului</p>
                  </div>
                  <Switch
                    checked={config.showAsBanner}
                    onCheckedChange={(v) => setField('showAsBanner', v)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">Popup (fereastră centrală)</p>
                    <p className="text-xs text-gray-400">Apare ca popup la prima vizitare a paginii</p>
                  </div>
                  <Switch
                    checked={config.showAsPopup}
                    onCheckedChange={(v) => setField('showAsPopup', v)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Se salvează...' : '💾 Salvează și Publică'}
            </button>
          </div>

          {/* Preview — 2/5 */}
          <div className="xl:col-span-2">
            <div className="sticky top-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Previzualizare banner
              </p>
              <div className="bg-[#0d0d0d] rounded-2xl border border-white/10 overflow-hidden p-1">
                <DailyMenuBanner data={previewData} preview />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Aspect real al bannerului pe site
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Schedule ────────────────────────────────────────────────── */}
      {activeTab === 'schedule' && (
        <div className="space-y-5">
          {/* Schedule toggle */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Activează program automat săptămânal</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Când este activ, conținutul pentru fiecare zi se selectează automat în funcție de ziua curentă
                </p>
              </div>
              <Switch
                checked={config.schedule.enabled}
                onCheckedChange={(v) =>
                  setConfig((prev) => ({ ...prev, schedule: { ...prev.schedule, enabled: v } }))
                }
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          {/* Day cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DAYS.map(({ key, label }) => {
              const day = config.schedule[key];
              return (
                <div
                  key={key}
                  className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">{label}</p>
                    <span className="text-lg">{day.type === 'meniu-zilei' ? '🍽️' : '☀️'}</span>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Tip</label>
                    <select
                      value={day.type}
                      onChange={(e) => setDayField(key, 'type', e.target.value as DailyMenuType)}
                      className={selectCls}
                    >
                      <option value="meniu-zilei">🍽️ Meniu Zilei</option>
                      <option value="mic-dejun">☀️ Mic Dejun</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Titlu</label>
                    <input
                      type="text"
                      value={day.title}
                      onChange={(e) => setDayField(key, 'title', e.target.value)}
                      placeholder="ex: Meniu de luni..."
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Descriere</label>
                    <textarea
                      value={day.description}
                      onChange={(e) => setDayField(key, 'description', e.target.value)}
                      placeholder="Descriere scurtă..."
                      rows={2}
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Preț (RON)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={day.price || ''}
                      onChange={(e) => setDayField(key, 'price', Number(e.target.value))}
                      placeholder="45"
                      className={inputCls}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Se salvează...' : '💾 Salvează programul săptămânal'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors';

const selectCls =
  'w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary transition-colors';
