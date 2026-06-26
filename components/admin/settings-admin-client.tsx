'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Save, Upload, Images, CheckCircle2, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  updateSettings,
  updateHeroImage,
  uploadHeroImage,
  updateDeliverySettings,
  updateBranding,
  uploadBrandingImage,
} from '@/lib/actions/settings';
import type { SiteSettings, HeroImages, DeliveryConfig, GpsTier, BrandingConfig } from '@/lib/server-data';

interface SettingsAdminClientProps {
  initialSettings: SiteSettings;
  mediaImages: string[];
}

const PAGE_CONFIGS: {
  key: keyof HeroImages;
  label: string;
  fallback: string;
}[] = [
  { key: 'acasa', label: 'Acasă', fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=450&fit=crop' },
  { key: 'meniu', label: 'Meniu', fallback: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=450&fit=crop' },
  { key: 'rezervari', label: 'Rezervări', fallback: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=450&fit=crop' },
  { key: 'cabana', label: 'Cabana Rivers', fallback: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=450&fit=crop' },
  { key: 'noutati', label: 'Noutăți', fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=450&fit=crop' },
  { key: 'contact', label: 'Contact', fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=450&fit=crop' },
  { key: 'cabanaFeature', label: 'Cabana — Imagine Secțiune', fallback: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=450&fit=crop' },
  { key: 'restaurant', label: 'Restaurant — Hero', fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=450&fit=crop' },
  { key: 'riversLand', label: "River's Land — Hero", fallback: 'https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=800&h=450&fit=crop' },
  { key: 'riversMarina', label: "River's Marina — Hero", fallback: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop' },
  { key: 'riversMarinaFeature', label: "River's Marina — Imagine Secțiune", fallback: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop' },
];

async function compressImage(file: File, maxWidth = 1920, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const DEFAULT_DELIVERY: DeliveryConfig = {
  restaurantLat: 44.2009,
  restaurantLng: 27.331,
  maxRadiusKm: 25,
  gpsTiers: [
    { fromKm: 0, toKm: 5, fee: 0, minOrder: 50 },
    { fromKm: 5, toKm: 10, fee: 10, minOrder: 50 },
    { fromKm: 10, toKm: 25, fee: 15, minOrder: 100 },
  ],
};

const DEFAULT_BRANDING: BrandingConfig = {
  logoLight: '/uploads/1782418815754-6p2rttowpm3.png',
  logoDark: '',
  favicon: '/favicon.ico',
  ogImage: '',
  logoWidth: 140,
  logoHeight: 44,
};

// ---------- Collapsible Section ----------
function Section({ id, title, open, onToggle, children }: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '16px 20px',
          background: '#1A1A1A',
          borderRadius: open ? '10px 10px 0 0' : '10px',
          border: '1px solid #2E2E2E',
          userSelect: 'none',
        }}
      >
        <h3 style={{ color: '#F0EDE6', fontSize: '16px', fontWeight: 600, margin: 0 }}>{title}</h3>
        <ChevronDown
          size={18}
          style={{
            color: '#9A9490',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        />
      </div>
      {open && (
        <div
          style={{
            background: '#1A1A1A',
            border: '1px solid #2E2E2E',
            borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            padding: '20px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function SettingsAdminClient({ initialSettings, mediaImages }: SettingsAdminClientProps) {
  // ── Collapsible sections ──────────────────────────────────────────
  const [openSections, setOpenSections] = useState<string[]>([]);
  function toggleSection(id: string) {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  // ── Hero images ───────────────────────────────────────────────────
  const [heroImages, setHeroImages] = useState<HeroImages>(
    initialSettings.heroImages ?? {
      acasa: '', restaurant: '', meniu: '', rezervari: '', cabana: '',
      noutati: '', contact: '', cabanaFeature: '', riversLand: '', riversMarina: '', riversMarinaFeature: '',
    }
  );
  const [versions, setVersions] = useState<Record<string, number>>({});
  const [uploadingPage, setUploadingPage] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);
  const [savedPages, setSavedPages] = useState<Set<string>>(new Set());
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Contact & Info ────────────────────────────────────────────────
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  function handleChange(field: keyof SiteSettings, value: string) {
    setSettings((s) => ({ ...s, [field]: value }));
  }

  // ── Delivery ──────────────────────────────────────────────────────
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>(initialSettings.delivery ?? DEFAULT_DELIVERY);
  const [savingDelivery, setSavingDelivery] = useState(false);

  // ── Branding ──────────────────────────────────────────────────────
  const [branding, setBranding] = useState<BrandingConfig>(initialSettings.branding ?? DEFAULT_BRANDING);
  const [brandingVersion, setBrandingVersion] = useState(0);
  const [uploadingBranding, setUploadingBranding] = useState<string | null>(null);
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingPickerOpen, setBrandingPickerOpen] = useState<string | null>(null);
  const brandingRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Handlers — Hero ───────────────────────────────────────────────
  async function applyHeroImage(pageKey: string, url: string) {
    const result = await updateHeroImage(pageKey, url);
    if (result.success) {
      setHeroImages((prev) => ({ ...prev, [pageKey]: url }));
      setVersions((prev) => ({ ...prev, [pageKey]: Date.now() }));
      setSavedPages((prev) => new Set(prev).add(pageKey));
      setTimeout(() => setSavedPages((prev) => { const s = new Set(prev); s.delete(pageKey); return s; }), 2000);
      toast.success('Imagine actualizată!');
    } else {
      toast.error(result.error ?? 'Eroare la salvare.');
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, pageKey: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPage(pageKey);
    const compressed = await compressImage(file);
    const fd = new FormData();
    fd.append('file', compressed);
    const result = await uploadHeroImage(fd, pageKey);
    setUploadingPage(null);
    if ('error' in result) {
      toast.error(result.error);
    } else {
      await applyHeroImage(pageKey, result.url);
    }
    e.target.value = '';
  }

  // ── Handlers — Contact ────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    const result = await updateSettings({
      hours: settings.hours,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
      addressCabana: settings.addressCabana,
    });
    setSaving(false);
    if (result.success) toast.success('Setări salvate!');
    else toast.error(result.error ?? 'Eroare la salvare.');
  }

  // ── Handlers — Delivery ───────────────────────────────────────────
  function updateTier(index: number, field: keyof GpsTier, value: string) {
    const num = parseFloat(value) || 0;
    setDeliveryConfig((prev) => ({
      ...prev,
      gpsTiers: prev.gpsTiers.map((t, i) => (i === index ? { ...t, [field]: num } : t)),
    }));
  }

  async function handleSaveDelivery() {
    setSavingDelivery(true);
    const result = await updateDeliverySettings(deliveryConfig);
    setSavingDelivery(false);
    if (result.success) toast.success('Setări livrare salvate!');
    else toast.error(result.error ?? 'Eroare la salvare.');
  }

  // ── Handlers — Branding ───────────────────────────────────────────
  const BRANDING_FIELD: Record<'light' | 'dark' | 'favicon' | 'og', keyof BrandingConfig> = {
    light: 'logoLight',
    dark: 'logoDark',
    favicon: 'favicon',
    og: 'ogImage',
  };

  async function handleUploadBranding(
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'light' | 'dark' | 'favicon' | 'og'
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBranding(type);
    // Compress only OG image (photo); logos/favicons need transparency preserved
    const toUpload = type === 'og' ? await compressImage(file, 1200, 0.88) : file;
    const fd = new FormData();
    fd.append('file', toUpload);
    const result = await uploadBrandingImage(fd, type);
    setUploadingBranding(null);
    if ('error' in result) {
      toast.error(result.error);
    } else {
      setBranding((prev) => ({ ...prev, [BRANDING_FIELD[type]]: result.url }));
      setBrandingVersion((v) => v + 1);
      toast.success('Imagine actualizată!');
    }
    e.target.value = '';
  }

  async function applyBrandingMedia(type: 'light' | 'dark' | 'favicon' | 'og', url: string) {
    const updated = { ...branding, [BRANDING_FIELD[type]]: url };
    setBranding(updated);
    setBrandingPickerOpen(null);
    const result = await updateBranding(updated);
    if (result.success) {
      setBrandingVersion((v) => v + 1);
      toast.success('Imagine actualizată!');
    } else {
      toast.error(result.error ?? 'Eroare.');
    }
  }

  async function clearDarkLogo() {
    const updated = { ...branding, logoDark: '' };
    setBranding(updated);
    const result = await updateBranding(updated);
    if (result.success) toast.success('Logo dark eliminat. Se aplică filtru alb automat.');
    else toast.error(result.error ?? 'Eroare.');
  }

  async function handleSaveBrandingDimensions() {
    setSavingBranding(true);
    const result = await updateBranding(branding);
    setSavingBranding(false);
    if (result.success) toast.success('Dimensiuni logo salvate!');
    else toast.error(result.error ?? 'Eroare.');
  }

  function BrandingMediaPicker({ type }: { type: 'light' | 'dark' | 'favicon' | 'og' }) {
    if (brandingPickerOpen !== type) return null;
    return (
      <div className="mt-2 p-2 rounded border border-white/10 bg-black/40">
        {mediaImages.length === 0 ? (
          <p className="text-xs text-gray-500 py-2 text-center">Nicio imagine în media.</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto">
            {mediaImages.map((url) => (
              <button
                key={url}
                onClick={() => applyBrandingMedia(type, url)}
                className="relative aspect-video rounded overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
              >
                <Image src={url} alt="" fill className="object-cover" unoptimized />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── 1. Logo & Identitate Vizuală ─────────────────────────── */}
      <Section id="logo-branding" title="🎨 Logo & Identitate Vizuală" open={openSections.includes('logo-branding')} onToggle={() => toggleSection('logo-branding')}>
        <p className="text-xs text-gray-500 mb-5">
          Gestionează logo-urile și imaginile brandului afișate pe site. Modificările se aplică imediat pe toate paginile.
        </p>

        <div className="space-y-5">
          {/* Card 1 — Logo light */}
          <div className="rounded-lg border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-semibold text-white mb-1">Logo principal (Tema Deschisă)</p>
            <p className="text-xs text-gray-500 mb-4">
              Folosit în tema luminoasă. Recomandat: PNG transparent cu text/icon întunecat (negru).
            </p>

            {/* Side-by-side light/dark simulation */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">☀️ Tema deschisă</p>
                <div
                  className="rounded border border-white/10 flex items-center justify-center p-3"
                  style={{ background: '#ffffff', minHeight: 80 }}
                >
                  {branding.logoLight ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`ll-${brandingVersion}`}
                      src={branding.logoLight}
                      alt="Logo light"
                      style={{ maxHeight: 48, maxWidth: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">Nicio imagine</span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">🌙 Tema întunecată</p>
                <div
                  className="rounded border border-white/10 flex items-center justify-center p-3"
                  style={{ background: '#0F0F0F', minHeight: 80 }}
                >
                  {branding.logoLight ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`ld-sim-${brandingVersion}`}
                      src={branding.logoDark || branding.logoLight}
                      alt="Logo dark preview"
                      style={{
                        maxHeight: 48,
                        maxWidth: '100%',
                        objectFit: 'contain',
                        filter: !branding.logoDark ? 'brightness(0) invert(1)' : 'none',
                      }}
                    />
                  ) : (
                    <span className="text-xs text-gray-500">Nicio imagine</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 border-white/20 text-white hover:bg-white/10 text-xs"
                onClick={() => brandingRefs.current['light']?.click()}
                disabled={uploadingBranding === 'light'}
              >
                <Upload className="h-3.5 w-3.5" />
                {uploadingBranding === 'light' ? 'Se încarcă...' : 'Încarcă logo'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 border-white/20 text-white hover:bg-white/10 text-xs"
                onClick={() => setBrandingPickerOpen(brandingPickerOpen === 'light' ? null : 'light')}
              >
                <Images className="h-3.5 w-3.5" />
                Din Media
              </Button>
              <input
                ref={(el) => { brandingRefs.current['light'] = el; }}
                type="file"
                accept="image/png,image/svg+xml,image/webp"
                className="hidden"
                onChange={(e) => handleUploadBranding(e, 'light')}
              />
            </div>
            <BrandingMediaPicker type="light" />
          </div>

          {/* Card 2 — Logo dark (optional) */}
          <div className="rounded-lg border border-white/10 bg-black/20 p-5">
            <div className="flex items-start justify-between mb-1 gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Logo Tema Întunecată (Opțional)</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  PNG transparent cu text/icon alb. Dacă nu încarci, se aplică filtru alb automat pe logo-ul principal.
                </p>
              </div>
              {branding.logoDark && (
                <button
                  type="button"
                  onClick={clearDarkLogo}
                  className="shrink-0 text-xs text-red-400 hover:text-red-300 px-2 py-1 border border-red-500/20 rounded hover:bg-red-500/10 transition-colors"
                >
                  🗑️ Șterge
                </button>
              )}
            </div>

            <div className="flex gap-3 mb-4 mt-3">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">🌙 Preview tema întunecată</p>
                <div
                  className="rounded border border-white/10 flex items-center justify-center p-3"
                  style={{ background: '#0F0F0F', minHeight: 80 }}
                >
                  {branding.logoDark ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`dark-${brandingVersion}`}
                      src={branding.logoDark}
                      alt="Logo dark"
                      style={{ maxHeight: 48, maxWidth: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span className="text-xs text-gray-500 italic">Folosește filtru alb pe logo principal</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 border-white/20 text-white hover:bg-white/10 text-xs"
                onClick={() => brandingRefs.current['dark']?.click()}
                disabled={uploadingBranding === 'dark'}
              >
                <Upload className="h-3.5 w-3.5" />
                {uploadingBranding === 'dark' ? 'Se încarcă...' : 'Încarcă logo dark'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 border-white/20 text-white hover:bg-white/10 text-xs"
                onClick={() => setBrandingPickerOpen(brandingPickerOpen === 'dark' ? null : 'dark')}
              >
                <Images className="h-3.5 w-3.5" />
                Din Media
              </Button>
              <input
                ref={(el) => { brandingRefs.current['dark'] = el; }}
                type="file"
                accept="image/png,image/svg+xml,image/webp"
                className="hidden"
                onChange={(e) => handleUploadBranding(e, 'dark')}
              />
            </div>
            <BrandingMediaPicker type="dark" />
          </div>

          {/* Card 3 — Favicon */}
          <div className="rounded-lg border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-semibold text-white mb-1">Favicon — Iconița din Tab Browser</p>
            <p className="text-xs text-gray-500 mb-4">
              Format: ICO, PNG (32×32 sau 64×64). Apare în tab-ul browser-ului și la bookmark.
            </p>

            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded border border-white/10 flex items-center justify-center bg-black/40 shrink-0"
              >
                {branding.favicon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`fav-${brandingVersion}`}
                    src={branding.favicon}
                    alt="Favicon"
                    width={32}
                    height={32}
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <span className="text-xs text-gray-500">ICO</span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                <p>32×32 px recomandat</p>
                <p className="mt-1">Formate: ICO, PNG, SVG</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 border-white/20 text-white hover:bg-white/10 text-xs"
                onClick={() => brandingRefs.current['favicon']?.click()}
                disabled={uploadingBranding === 'favicon'}
              >
                <Upload className="h-3.5 w-3.5" />
                {uploadingBranding === 'favicon' ? 'Se încarcă...' : 'Încarcă favicon'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 border-white/20 text-white hover:bg-white/10 text-xs"
                onClick={() => setBrandingPickerOpen(brandingPickerOpen === 'favicon' ? null : 'favicon')}
              >
                <Images className="h-3.5 w-3.5" />
                Din Media
              </Button>
              <input
                ref={(el) => { brandingRefs.current['favicon'] = el; }}
                type="file"
                accept="image/x-icon,image/png,image/svg+xml"
                className="hidden"
                onChange={(e) => handleUploadBranding(e, 'favicon')}
              />
            </div>
            <BrandingMediaPicker type="favicon" />
          </div>

          {/* Card 4 — OG Image */}
          <div className="rounded-lg border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-semibold text-white mb-1">Imagine Social Media (OG Image)</p>
            <p className="text-xs text-gray-500 mb-4">
              Apare când distribuiești linkul pe Facebook, WhatsApp, Twitter. Dimensiune recomandată: 1200×628px.
            </p>

            <div
              className="relative rounded overflow-hidden border border-white/10 bg-black/40 mb-4 flex items-center justify-center"
              style={{ aspectRatio: '1200/628', maxHeight: 180 }}
            >
              {branding.ogImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`og-${brandingVersion}`}
                  src={branding.ogImage}
                  alt="OG Image"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span className="text-xs text-gray-500">1200 × 628 px</span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 border-white/20 text-white hover:bg-white/10 text-xs"
                onClick={() => brandingRefs.current['og']?.click()}
                disabled={uploadingBranding === 'og'}
              >
                <Upload className="h-3.5 w-3.5" />
                {uploadingBranding === 'og' ? 'Se încarcă...' : 'Încarcă imagine'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 border-white/20 text-white hover:bg-white/10 text-xs"
                onClick={() => setBrandingPickerOpen(brandingPickerOpen === 'og' ? null : 'og')}
              >
                <Images className="h-3.5 w-3.5" />
                Din Media
              </Button>
              <input
                ref={(el) => { brandingRefs.current['og'] = el; }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleUploadBranding(e, 'og')}
              />
            </div>
            <BrandingMediaPicker type="og" />
          </div>

          {/* Card 5 — Dimensions */}
          <div className="rounded-lg border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-semibold text-white mb-3">Dimensiuni Logo în Header / Footer</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-gray-400 text-xs">Lățime (px)</Label>
                <Input
                  type="number"
                  min="40"
                  max="400"
                  value={branding.logoWidth}
                  onChange={(e) => setBranding((prev) => ({ ...prev, logoWidth: parseInt(e.target.value) || 140 }))}
                  className="mt-1 bg-black/40 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Înălțime (px)</Label>
                <Input
                  type="number"
                  min="20"
                  max="200"
                  value={branding.logoHeight}
                  onChange={(e) => setBranding((prev) => ({ ...prev, logoHeight: parseInt(e.target.value) || 44 }))}
                  className="mt-1 bg-black/40 border-white/10 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSaveBrandingDimensions}
                disabled={savingBranding}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="h-4 w-4" />
                {savingBranding ? 'Se salvează...' : 'Salvează dimensiuni'}
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 2. Imagini Hero ──────────────────────────────────────── */}
      <Section id="imagini-hero" title="🖼️ Imagini Hero" open={openSections.includes('imagini-hero')} onToggle={() => toggleSection('imagini-hero')}>
        <p className="text-xs text-gray-500 mb-5">
          Modificările se salvează automat la selectarea imaginii. Fiecare pagină are imaginea sa independentă.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PAGE_CONFIGS.map(({ key, label, fallback }) => {
            const storedUrl = heroImages[key];
            const v = versions[key];
            const previewSrc = storedUrl
              ? (storedUrl.startsWith('/') ? `${storedUrl}?v=${v ?? 0}` : storedUrl)
              : fallback;
            const isUploading = uploadingPage === key;
            const isPickerOpen = pickerOpen === key;
            const isSaved = savedPages.has(key);

            return (
              <div key={key} className="bg-black/30 rounded-lg border border-white/10 overflow-hidden flex flex-col">
                <div className="relative h-[160px] w-full bg-black">
                  <Image
                    key={v ?? key}
                    src={previewSrc}
                    alt={label}
                    fill
                    className="object-cover opacity-90"
                    unoptimized={previewSrc.startsWith('/')}
                  />
                  {isSaved && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <CheckCircle2 className="h-8 w-8 text-green-400" />
                    </div>
                  )}
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <p className="text-sm font-medium text-white">{label}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 border-white/20 text-white hover:bg-white/10 text-xs"
                      onClick={() => fileInputRefs.current[key]?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {isUploading ? 'Se încarcă...' : 'Încarcă poză'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 border-white/20 text-white hover:bg-white/10 text-xs"
                      onClick={() => setPickerOpen(isPickerOpen ? null : key)}
                    >
                      <Images className="h-3.5 w-3.5" />
                      Din Media
                    </Button>
                    <input
                      ref={(el) => { fileInputRefs.current[key] = el; }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleUpload(e, key)}
                    />
                  </div>
                  {isPickerOpen && (
                    <div className="mt-1 p-2 rounded border border-white/10 bg-black/40">
                      {mediaImages.length === 0 ? (
                        <p className="text-xs text-gray-500 py-2 text-center">
                          Nicio imagine în media. Încarcă în secțiunea Media mai întâi.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto">
                          {mediaImages.map((url) => (
                            <button
                              key={url}
                              onClick={async () => { setPickerOpen(null); await applyHeroImage(key, url); }}
                              className="relative aspect-video rounded overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                            >
                              <Image src={url} alt="" fill className="object-cover" unoptimized />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── 3. Contact & Program ─────────────────────────────────── */}
      <Section id="contact-program" title="📞 Informații Contact & Program" open={openSections.includes('contact-program')} onToggle={() => toggleSection('contact-program')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {(
            [
              { field: 'hours', label: 'Program (afișat în footer și contact)', placeholder: 'Luni – Duminică: 07:30 – 00:00' },
              { field: 'phone', label: 'Telefon', placeholder: '07xx xxx xxx' },
              { field: 'email', label: 'Email', placeholder: 'contact@riverslounge.ro' },
              { field: 'address', label: 'Adresă', placeholder: 'Strada...' },
            ] as { field: keyof SiteSettings; label: string; placeholder: string }[]
          ).map(({ field, label, placeholder }) => (
            <div key={field}>
              <Label className="text-gray-400 text-xs">{label}</Label>
              <Input
                value={settings[field] as string}
                onChange={(e) => handleChange(field, e.target.value)}
                className="mt-1 bg-black/40 border-white/10 text-white"
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Se salvează...' : 'Salvează Setările'}
          </Button>
        </div>
      </Section>

      {/* ── 4. Livrare ───────────────────────────────────────────── */}
      <Section id="livrare" title="🚗 Setări Livrare" open={openSections.includes('livrare')} onToggle={() => toggleSection('livrare')}>
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-white">Coordonate & Zone Tarif GPS</p>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Coordonatele restaurantului determină distanța față de client pentru calculul tarifului.
          Găsești coordonatele pe Google Maps → click dreapta pe locație.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <Label className="text-gray-400 text-xs">Latitudine restaurant</Label>
            <Input
              type="number"
              step="0.0001"
              value={deliveryConfig.restaurantLat}
              onChange={(e) => setDeliveryConfig((p) => ({ ...p, restaurantLat: parseFloat(e.target.value) || 0 }))}
              className="mt-1 bg-black/40 border-white/10 text-white"
              placeholder="44.2009"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">Longitudine restaurant</Label>
            <Input
              type="number"
              step="0.0001"
              value={deliveryConfig.restaurantLng}
              onChange={(e) => setDeliveryConfig((p) => ({ ...p, restaurantLng: parseFloat(e.target.value) || 0 }))}
              className="mt-1 bg-black/40 border-white/10 text-white"
              placeholder="27.3310"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">Rază maximă livrare (km)</Label>
            <Input
              type="number"
              step="1"
              min="1"
              value={deliveryConfig.maxRadiusKm}
              onChange={(e) => setDeliveryConfig((p) => ({ ...p, maxRadiusKm: parseInt(e.target.value) || 1 }))}
              className="mt-1 bg-black/40 border-white/10 text-white"
              placeholder="25"
            />
          </div>
        </div>

        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Tarife livrare pe distanță (GPS)
          </p>
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <div className="grid grid-cols-4 gap-px bg-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <div className="bg-[#111] px-3 py-2">De la (km)</div>
              <div className="bg-[#111] px-3 py-2">Până la (km)</div>
              <div className="bg-[#111] px-3 py-2">Tarif (RON)</div>
              <div className="bg-[#111] px-3 py-2">Min. comandă (RON)</div>
            </div>
            {deliveryConfig.gpsTiers.map((tier, i) => (
              <div key={i} className="grid grid-cols-4 gap-px bg-white/10">
                {(['fromKm', 'toKm', 'fee', 'minOrder'] as (keyof GpsTier)[]).map((field) => (
                  <div key={field} className="bg-[#111] px-2 py-1.5">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={tier[field]}
                      onChange={(e) => updateTier(i, field, e.target.value)}
                      className="h-7 bg-black/40 border-white/10 text-white text-xs"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSaveDelivery}
            disabled={savingDelivery}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            {savingDelivery ? 'Se salvează...' : 'Salvează setări livrare'}
          </Button>
        </div>
      </Section>

    </div>
  );
}
