'use client';

import { useState } from 'react';
import { Megaphone, ChevronDown, ChevronUp, RotateCcw, Save, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PopupCard } from '@/components/popup/promo-popup';
import { updatePopupSettings } from '@/lib/actions/settings';
import type { PopupConfig } from '@/lib/server-data';
import { ImagePickerField } from './image-picker-field';

// ── Type options ──────────────────────────────────────────────────────────────

const POPUP_TYPES: { value: PopupConfig['type']; icon: string; label: string; color: string }[] = [
  { value: 'promo',        icon: '🏷️', label: 'Promoție',  color: '#F87171' },
  { value: 'event',        icon: '🎉', label: 'Eveniment', color: '#A78BFA' },
  { value: 'seasonal',     icon: '🌟', label: 'Sezonier',  color: '#4ADE80' },
  { value: 'announcement', icon: '📢', label: 'Anunț',     color: '#60A5FA' },
];

const DEFAULT_COLORS = { backgroundColor: '#1A1A1A', accentColor: '#C9A84C' };

// ── Props ─────────────────────────────────────────────────────────────────────

interface PopupAdminClientProps {
  initialPopup: PopupConfig;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PopupAdminClient({ initialPopup }: PopupAdminClientProps) {
  const [popup, setPopup] = useState<PopupConfig>(initialPopup);
  const [saving, setSaving] = useState(false);
  const [showColors, setShowColors] = useState(false);

  function set<K extends keyof PopupConfig>(key: K, value: PopupConfig[K]) {
    setPopup(p => ({ ...p, [key]: value }));
  }

  const isExpired = popup.expiresAt ? new Date(popup.expiresAt) < new Date() : false;

  async function handleSave() {
    if (!popup.title.trim()) return toast.error('Titlul popup-ului este obligatoriu.');
    setSaving(true);
    try {
      const result = await updatePopupSettings(popup);
      if (!result.success) throw new Error(result.error);
      toast.success('✅ Popup actualizat! Va apărea pe site în câteva secunde.');
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  const expiresLocalValue = popup.expiresAt
    ? new Date(popup.expiresAt).toISOString().slice(0, 16)
    : '';

  return (
    <div className="p-6 lg:p-8 pt-20 lg:pt-8 min-h-screen">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Popup Promoțional
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Controlează popup-ul de oferte de pe pagina principală
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          Previzualizează site-ul
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* ── Master toggle ── */}
      <div className={`flex items-center justify-between rounded-2xl border p-5 mb-8 transition-all ${
        popup.enabled
          ? 'bg-primary/10 border-primary/30'
          : 'bg-[#1a1a1a] border-white/10'
      }`}>
        <div>
          <p className="text-base font-semibold text-white mb-0.5">
            {popup.enabled ? '● POPUP ACTIV' : '○ POPUP INACTIV'}
          </p>
          <p className="text-xs text-gray-400">
            {popup.enabled
              ? 'Popup-ul este vizibil pe pagina principală.'
              : 'Popup-ul nu apare pe site. Activează-l când ești gata.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            popup.enabled
              ? 'bg-green-500/15 text-green-400'
              : 'bg-white/5 text-gray-500'
          }`}>
            {popup.enabled ? 'ACTIV' : 'INACTIV'}
          </span>
          <Switch
            checked={popup.enabled}
            onCheckedChange={v => set('enabled', v)}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex flex-col xl:flex-row gap-8">

        {/* ── LEFT: Form (60%) ── */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* Expired warning */}
          {isExpired && popup.expiresAt && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-sm text-yellow-400">
              ⚠️ Popup-ul a expirat. Setează o dată viitoare sau dezactivează.
            </div>
          )}

          {/* Tip popup */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tip popup</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {POPUP_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => set('type', t.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium ${
                    popup.type === t.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conținut */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Conținut</p>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Text badge</Label>
              <Input
                value={popup.badgeText}
                onChange={e => set('badgeText', e.target.value)}
                placeholder='ex: REDUCERE 20%, EVENIMENT SPECIAL...'
                className="bg-[#0F0F0F] border-white/10 text-white focus-visible:ring-primary"
              />
              <p className="text-xs text-gray-500">Lasă gol pentru textul implicit al tipului</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Titlu principal *</Label>
              <Input
                value={popup.title}
                onChange={e => set('title', e.target.value)}
                placeholder='ex: Reducere 20% la toate preparatele!'
                className="bg-[#0F0F0F] border-white/10 text-white focus-visible:ring-primary text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Subtitle (auriu)</Label>
              <Input
                value={popup.subtitle}
                onChange={e => set('subtitle', e.target.value)}
                placeholder='ex: Valabil până pe 30 iunie 2026'
                className="bg-[#0F0F0F] border-white/10 text-white focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Descriere</Label>
              <Textarea
                value={popup.description}
                onChange={e => set('description', e.target.value)}
                placeholder='Detalii suplimentare despre ofertă sau eveniment...'
                rows={3}
                className="bg-[#0F0F0F] border-white/10 text-white focus-visible:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Imagine */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Imagine (opțional)</p>
            <ImagePickerField
              label=""
              value={popup.image}
              onChange={url => set('image', url)}
            />
          </div>

          {/* CTA buttons */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Butoane CTA</p>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-300">Label buton principal</Label>
                <Input
                  value={popup.ctaLabel}
                  onChange={e => set('ctaLabel', e.target.value)}
                  placeholder='ex: Vezi oferta'
                  className="bg-[#0F0F0F] border-white/10 text-white focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300">URL buton principal</Label>
                <Input
                  value={popup.ctaUrl}
                  onChange={e => set('ctaUrl', e.target.value)}
                  placeholder='/meniu'
                  className="bg-[#0F0F0F] border-white/10 text-white focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-xs">Label buton secundar (opțional)</Label>
                <Input
                  value={popup.ctaSecondaryLabel}
                  onChange={e => set('ctaSecondaryLabel', e.target.value)}
                  placeholder='ex: Află mai mult'
                  className="bg-[#0F0F0F] border-white/10 text-white focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-xs">URL buton secundar</Label>
                <Input
                  value={popup.ctaSecondaryUrl}
                  onChange={e => set('ctaSecondaryUrl', e.target.value)}
                  placeholder='/noutati'
                  className="bg-[#0F0F0F] border-white/10 text-white focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Setări afișare */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Setări afișare</p>

            {/* showOnce */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Afișează o singură dată per vizitator</p>
                <p className="text-xs text-gray-400 mt-0.5">Vizitatorii care au închis popup-ul nu îl vor mai vedea</p>
              </div>
              <Switch
                checked={popup.showOnce}
                onCheckedChange={v => set('showOnce', v)}
                className="data-[state=checked]:bg-primary shrink-0"
              />
            </div>

            {/* Delay slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Întârziere afișare</Label>
                <span className="text-sm font-semibold text-primary">{popup.showDelay}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={popup.showDelay}
                onChange={e => set('showDelay', parseInt(e.target.value))}
                className="w-full accent-[#C9A84C]"
              />
              <p className="text-xs text-gray-500">
                Popup apare după {popup.showDelay} {popup.showDelay === 1 ? 'secundă' : 'secunde'}
              </p>
            </div>

            {/* Expiry */}
            <div className="space-y-1.5">
              <Label className="text-gray-300">Data expirare (opțional)</Label>
              <input
                type="datetime-local"
                value={expiresLocalValue}
                onChange={e => set('expiresAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
                className="w-full bg-[#0F0F0F] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary [color-scheme:dark]"
              />
              {popup.expiresAt && (
                <p className={`text-xs mt-0.5 ${isExpired ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {isExpired
                    ? '⚠️ Expirat — popup-ul nu va mai apărea'
                    : `Popup dispare automat pe ${new Date(popup.expiresAt).toLocaleString('ro-RO')}`}
                </p>
              )}
              {popup.expiresAt && (
                <button
                  onClick={() => set('expiresAt', '')}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  × Elimină data expirare
                </button>
              )}
            </div>
          </div>

          {/* Culori (collapsible) */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowColors(!showColors)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Culori (avansat)</p>
              {showColors ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {showColors && (
              <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Culoare fundal card</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={popup.backgroundColor}
                        onChange={e => set('backgroundColor', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                      />
                      <Input
                        value={popup.backgroundColor}
                        onChange={e => set('backgroundColor', e.target.value)}
                        className="bg-[#0F0F0F] border-white/10 text-white focus-visible:ring-primary font-mono text-sm"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Culoare accent</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={popup.accentColor}
                        onChange={e => set('accentColor', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                      />
                      <Input
                        value={popup.accentColor}
                        onChange={e => set('accentColor', e.target.value)}
                        className="bg-[#0F0F0F] border-white/10 text-white focus-visible:ring-primary font-mono text-sm"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setPopup(p => ({ ...p, ...DEFAULT_COLORS }))}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Resetează la valorile implicite
                </button>
              </div>
            )}
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 py-6 text-base font-bold"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Se salvează...' : '💾 Salvează și Publică'}
          </Button>
        </div>

        {/* ── RIGHT: Live Preview (40%) ── */}
        <div className="xl:w-[380px] shrink-0">
          <div className="sticky top-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Eye className="h-3.5 w-3.5" />
              Previzualizare live
            </p>

            <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-4">
              {popup.title?.trim() ? (
                <PopupCard popup={popup} preview />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Megaphone className="h-10 w-10 text-gray-700 mb-3" />
                  <p className="text-sm text-gray-500">
                    Completează titlul pentru a vedea previzualizarea
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2 text-center">
              Acesta este aspectul popup-ului pe site
            </p>

            {popup.enabled && !isExpired && (
              <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 text-xs text-green-400 text-center">
                ● Popup activ — vizibil pe pagina principală
              </div>
            )}

            {popup.enabled && isExpired && (
              <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2 text-xs text-yellow-400 text-center">
                ⚠️ Activ dar expirat — nu se afișează
              </div>
            )}

            {!popup.enabled && (
              <div className="mt-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-500 text-center">
                ○ Popup inactiv — nu apare pe site
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
