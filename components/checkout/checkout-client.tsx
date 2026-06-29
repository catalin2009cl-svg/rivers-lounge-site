'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  Store,
  Banknote,
  CreditCard,
  User,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
  Navigation,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/cart-context';
import { saveOrder } from '@/lib/actions/orders';
import { haversineDistance } from '@/lib/haversine';
import { DELIVERY_ZONES, validateDelivery, validateGpsDelivery } from '@/lib/delivery-zones';
import { getStreetsForCity } from '@/lib/data/streets';
import { toast } from 'sonner';
import type { DeliveryConfig } from '@/lib/server-data';
import type { ActiveReward } from '@/lib/loyalty/types';

interface CheckoutUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

// ── Types ────────────────────────────────────────────────────────────────────

type DeliveryMethod = 'manual' | 'gps';
type GpsStatus = 'idle' | 'detecting' | 'success' | 'outside-range';

interface GpsData {
  status: GpsStatus;
  userLat?: number;
  userLng?: number;
  distanceKm?: number;
  fee?: number;
  minOrder?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isValidRoPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
  return /^(07[0-9]{8}|\+407[0-9]{8}|00407[0-9]{8})$/.test(cleaned);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CheckoutClientProps {
  deliveryConfig: DeliveryConfig;
  currentUser: CheckoutUser | null;
  savedAddresses: { address: string; city: string; count: number }[];
  activeReward?: ActiveReward | null;
  walletBalance?: number;
  walletExpiresAt?: string | null;
  welcomeBonusActive?: boolean;
  welcomeBonusMinOrderValue?: number;
}

export function CheckoutClient({ deliveryConfig, currentUser, savedAddresses, activeReward, walletBalance = 0, walletExpiresAt = null, welcomeBonusActive = false, welcomeBonusMinOrderValue = 60 }: CheckoutClientProps) {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [rewardApplied, setRewardApplied] = useState(false);
  const [walletCreditApplied, setWalletCreditApplied] = useState(false);

  // Delivery method state (maps to spec's form state fields)
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('manual');
  const [gps, setGps] = useState<GpsData>({ status: 'idle' });

  // Manual delivery city
  const [city, setCity] = useState('Călărași');

  // Form fields
  const [form, setForm] = useState({
    name: currentUser?.name ?? '',
    phone: currentUser?.phone ?? '',
    address: '',
    addressDetails: '',
    notes: '',
    paymentMethod: 'cash' as 'cash' | 'card',
  });
  const [phoneError, setPhoneError] = useState('');
  const [orderType, setOrderType] = useState<'livrare' | 'ridicare'>('livrare');
  const [submitting, setSubmitting] = useState(false);
  const [selectedSavedIdx, setSelectedSavedIdx] = useState<number | null>(null);
  const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const streetRef = useRef<HTMLDivElement>(null);
  const streetNumberRef = useRef<HTMLInputElement>(null);
  const [streetNumber, setStreetNumber] = useState('');
  const [showBlocDetails, setShowBlocDetails] = useState(false);
  const [bloc, setBloc] = useState('');
  const [scara, setScara] = useState('');
  const [etaj, setEtaj] = useState('');
  const [apt, setApt] = useState('');

  // ── Derived fee ─────────────────────────────────────────────────────────
  const subtotal = Math.round(totalPrice * 100) / 100;

  const feeCalc = (() => {
    if (orderType === 'ridicare') return { deliveryFee: 0, minOrder: 0, valid: true, missing: 0 };
    if (deliveryMethod === 'gps') {
      if (gps.status === 'success' && gps.fee !== undefined && gps.minOrder !== undefined) {
        const missing = Math.max(0, gps.minOrder - subtotal);
        return { deliveryFee: gps.fee, minOrder: gps.minOrder, valid: subtotal >= gps.minOrder, missing };
      }
      if (gps.status === 'outside-range') {
        return { deliveryFee: 0, minOrder: 0, valid: false, missing: 0 };
      }
      // idle or detecting → not ready yet, block submit
      return { deliveryFee: 0, minOrder: 0, valid: false, missing: 0 };
    }
    return validateDelivery(city, subtotal);
  })();

  const { deliveryFee, minOrder, missing } = feeCalc;
  const belowMinimum = !feeCalc.valid && orderType === 'livrare';
  const loyaltyDiscount =
    rewardApplied && activeReward
      ? Math.min(activeReward.rewardValue, subtotal)
      : 0;
  const welcomeBonusBlocked = welcomeBonusActive && subtotal < welcomeBonusMinOrderValue;
  const walletCredit =
    walletCreditApplied && walletBalance > 0 && !welcomeBonusBlocked
      ? Math.min(walletBalance, Math.max(0, subtotal - loyaltyDiscount))
      : 0;
  const total = Math.max(0, subtotal + deliveryFee - loyaltyDiscount - walletCredit);

  const derivedDetails = [
    bloc && `Bl. ${bloc}`,
    scara && `Sc. ${scara}`,
    etaj && `Et. ${etaj}`,
    apt && `Ap. ${apt}`,
  ].filter(Boolean).join(', ');

  const fullAddress = form.address.trim()
    ? `${form.address.trim()}${streetNumber.trim() ? ` nr. ${streetNumber.trim()}` : ''}`
    : '';

  const addressPreview = fullAddress
    ? [fullAddress, derivedDetails, deliveryMethod === 'manual' ? city : ''].filter(Boolean).join(', ')
    : '';

  // ── Handlers ────────────────────────────────────────────────────────────
  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.warning('Browserul tău nu suportă localizarea GPS. Selectează orașul manual.');
      setDeliveryMethod('manual');
      return;
    }
    setGps({ status: 'detecting' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: userLat, longitude: userLng } = position.coords;
        const distanceKm = haversineDistance(
          userLat, userLng,
          deliveryConfig.restaurantLat,
          deliveryConfig.restaurantLng
        );

        if (distanceKm > deliveryConfig.maxRadiusKm) {
          setGps({ status: 'outside-range', userLat, userLng, distanceKm });
          return;
        }

        const result = validateGpsDelivery(distanceKm, subtotal, deliveryConfig.gpsTiers);
        if (!result) {
          setGps({ status: 'outside-range', userLat, userLng, distanceKm });
          return;
        }

        setGps({
          status: 'success',
          userLat, userLng, distanceKm,
          fee: result.deliveryFee,
          minOrder: result.minOrder,
        });
      },
      (err) => {
        const isDenied = err.code === 1 || err.code === 2;
        toast.warning(
          isDenied
            ? 'Accesul la locație a fost refuzat. Selectează orașul manual.'
            : 'Locația nu a putut fi detectată. Selectează orașul manual.'
        );
        setGps({ status: 'idle' });
        setDeliveryMethod('manual');
      },
      { timeout: 12000, maximumAge: 60000 }
    );
  }, [deliveryConfig, subtotal]);

  function switchToGps() {
    setDeliveryMethod('gps');
    setGps({ status: 'idle' });
  }

  function switchToManual() {
    setDeliveryMethod('manual');
    setGps({ status: 'idle' });
  }

  function applySavedAddress(addr: { address: string; city: string }, idx: number) {
    setSelectedSavedIdx(idx);
    update('address', addr.address);
    setStreetNumber('');
    setCity(addr.city);
    setDeliveryMethod('manual');
    setGps({ status: 'idle' });
    setShowSuggestions(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (streetRef.current && !streetRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleAddressChange(value: string) {
    update('address', value);
    const query = value.trim().toLowerCase();
    if (query.length >= 1 && deliveryMethod === 'manual') {
      const streets = getStreetsForCity(city);
      const matches = streets
        .filter((s) => s.toLowerCase().includes(query))
        .slice(0, 8);
      setStreetSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setStreetSuggestions([]);
      setShowSuggestions(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const phoneFromAccount = !!(currentUser?.phone);
    if (!phoneFromAccount && !isValidRoPhone(form.phone)) {
      setPhoneError('Număr invalid. Format acceptat: 07xxxxxxxx');
      return;
    }
    setPhoneError('');

    if (orderType === 'livrare') {
      if (deliveryMethod === 'gps' && gps.status !== 'success') {
        toast.error('Detectează locația înainte de a plasa comanda.');
        return;
      }
      if (!fullAddress) {
        toast.error('Introduceți adresa de livrare.');
        return;
      }
      if (belowMinimum && minOrder > 0) {
        toast.error(`Comandă minimă: ${minOrder} RON. Mai adaugă ${missing.toFixed(0)} RON.`);
        return;
      }
    }

    setSubmitting(true);

    const cityLabel = orderType === 'ridicare'
      ? ''
      : deliveryMethod === 'gps'
        ? `GPS (${gps.distanceKm?.toFixed(1)}km)`
        : city;

    const result = await saveOrder({
      name: currentUser?.name ?? form.name.trim(),
      phone: currentUser?.phone ?? form.phone.trim(),
      address: orderType === 'ridicare' ? '' : fullAddress,
      city: cityLabel,
      addressDetails: derivedDetails,
      items: items.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        unit: i.product.unit ?? '',
        ...(i.product.subcategory ? { category: i.product.subcategory } : {}),
      })),
      subtotal,
      deliveryFee,
      total,
      paymentMethod: form.paymentMethod,
      orderType,
      notes: form.notes.trim(),
      ...(gps.userLat !== undefined ? { userLat: gps.userLat, userLng: gps.userLng } : {}),
      ...(currentUser?.email ? { userEmail: currentUser.email } : {}),
      ...(currentUser?.id ? { userId: currentUser.id } : {}),
      ...(rewardApplied && activeReward
        ? { loyaltyRewardId: activeReward.id, loyaltyDiscountAmount: loyaltyDiscount }
        : {}),
      ...(walletCredit > 0 ? { walletCreditAmount: walletCredit } : {}),
    });
    setSubmitting(false);

    if (!result.success || !result.id) {
      toast.error(result.error || 'Eroare la plasarea comenzii.');
      return;
    }

    const finalPhone = currentUser?.phone ?? form.phone.trim();
    const finalName = currentUser?.name ?? form.name.trim();

    clearCart();
    router.push(
      `/comanda/success?id=${result.id}` +
      `&phone=${encodeURIComponent(finalPhone)}` +
      `&name=${encodeURIComponent(finalName)}` +
      `&total=${total.toFixed(0)}`
    );
  }

  // ── Empty cart ───────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-sm w-full text-center space-y-4">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto" />
          <h1 className="font-serif text-xl font-semibold text-foreground">Coșul este gol</h1>
          <p className="text-sm text-muted-foreground">
            Adaugă produse din meniu pentru a plasa o comandă.
          </p>
          <Link href="/meniu">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Mergi la meniu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Checkout ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
      <Link
        href="/meniu"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la meniu
      </Link>

      <h1 className="font-serif text-2xl font-bold text-foreground mb-8">
        Finalizează Comanda
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Left: form ──────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-6">

            {/* 1. Tip comandă */}
            <section className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Tip comandă</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderType('livrare')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    orderType === 'livrare'
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <Truck className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Livrare la domiciliu</p>
                    <p className="text-xs opacity-70 mt-0.5">Livrăm în Călărași și împrejurimi</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('ridicare')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    orderType === 'ridicare'
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <Store className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Ridicare din restaurant</p>
                    <p className="text-xs opacity-70 mt-0.5">Str. Dobrogei nr. 1, Călărași</p>
                  </div>
                </button>
              </div>
            </section>

            {/* 2. Date de contact */}
            {currentUser ? (
              <section className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {currentUser.email}{currentUser.phone ? ` · ${currentUser.phone}` : ''}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/cont/autentificare"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap shrink-0"
                  >
                    Nu ești tu? →
                  </Link>
                </div>
                {!currentUser.phone && (
                  <div className="mt-4">
                    <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                      <Phone className="h-3.5 w-3.5" /> Telefon de contact *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="07xx xxx xxx"
                      value={form.phone}
                      onChange={(e) => { update('phone', e.target.value); setPhoneError(''); }}
                      className={phoneError ? 'border-red-400 focus-visible:ring-red-400' : ''}
                      required
                    />
                    {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                  </div>
                )}
              </section>
            ) : (
              <>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
                  <span className="text-lg mt-0.5">💡</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground mb-0.5">Ai cont? Checkout mai rapid</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Loghează-te și datele tale se completează automat, fără să mai completezi nimic.
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        href="/cont/autentificare"
                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        Intră în cont →
                      </Link>
                      <span className="text-xs text-muted-foreground">sau continuă ca vizitator</span>
                    </div>
                  </div>
                </div>
                <section className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="font-semibold text-foreground mb-4">Date de contact</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                        <User className="h-3.5 w-3.5" /> Nume complet *
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ion Popescu"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                        <Phone className="h-3.5 w-3.5" /> Telefon *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="07xx xxx xxx"
                        value={form.phone}
                        onChange={(e) => { update('phone', e.target.value); setPhoneError(''); }}
                        className={phoneError ? 'border-red-400 focus-visible:ring-red-400' : ''}
                        required
                      />
                      {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* 3. Adresă livrare */}
            {orderType === 'livrare' && (
              <section className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-foreground mb-4">Adresă de livrare</h2>

                {/* Saved addresses quick-select */}
                {currentUser && savedAddresses.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs text-muted-foreground mb-2">Adrese salvate:</p>
                    <div className="flex flex-wrap gap-2">
                      {savedAddresses.map((addr, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => applySavedAddress(addr, i)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            selectedSavedIdx === i
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                          }`}
                        >
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[160px]">{addr.address}, {addr.city}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => { setSelectedSavedIdx(null); update('address', ''); setStreetNumber(''); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          selectedSavedIdx === null && !form.address
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        + Adresă nouă
                      </button>
                    </div>
                  </div>
                )}

                {/* GPS / Manual toggle */}
                <div className="flex gap-2 mb-5 p-1 bg-secondary/60 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={switchToGps}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      deliveryMethod === 'gps'
                        ? 'bg-card shadow-sm text-primary border border-primary/20'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Navigation className="h-4 w-4" />
                    Detectează locația
                  </button>
                  <button
                    type="button"
                    onClick={switchToManual}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      deliveryMethod === 'manual'
                        ? 'bg-card shadow-sm text-primary border border-primary/20'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    Alege manual
                  </button>
                </div>

                {/* ── GPS panel ── */}
                {deliveryMethod === 'gps' && (
                  <div className="mb-4">
                    {/* Idle: detect button */}
                    {gps.status === 'idle' && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 gap-2"
                        onClick={detectLocation}
                      >
                        <Navigation className="h-4 w-4" />
                        Detectează locația mea
                      </Button>
                    )}

                    {/* Detecting: spinner */}
                    {gps.status === 'detecting' && (
                      <div className="flex items-center justify-center gap-3 py-5 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm">Se detectează locația...</span>
                      </div>
                    )}

                    {/* Success + within range: green box */}
                    {gps.status === 'success' && gps.userLat && gps.userLng && (
                      <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
                        <p className="text-sm font-semibold text-green-800">
                          ✅ Livrăm la adresa ta! Distanță:{' '}
                          {gps.distanceKm?.toFixed(1)} km | Tarif livrare:{' '}
                          {gps.fee === 0 ? 'GRATUIT' : `${gps.fee} RON`}
                        </p>
                        {(gps.minOrder ?? 0) > 0 && (
                          <p className="text-xs text-green-700">
                            Comandă minimă: <strong>{gps.minOrder} RON</strong>
                          </p>
                        )}
                        <div className="flex items-center gap-3 pt-1">
                          <a
                            href={`https://maps.google.com/?q=${gps.userLat},${gps.userLng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Verifică pe Google Maps
                          </a>
                          <button
                            type="button"
                            onClick={detectLocation}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Redetectează
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Outside range: red box */}
                    {gps.status === 'outside-range' && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
                        <p className="text-sm text-red-700">
                          ❌ Ne pare rău, adresa ta este prea departe
                          {gps.distanceKm ? ` (${gps.distanceKm.toFixed(1)} km)` : ''}. Raza
                          noastră de livrare este de{' '}
                          <strong>{deliveryConfig.maxRadiusKm} km</strong>.
                        </p>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={detectLocation} className="text-xs h-7">
                            Încearcă din nou
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={switchToManual} className="text-xs h-7">
                            Alege manual
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Manual: city dropdown ── */}
                {deliveryMethod === 'manual' && (
                  <div className="mb-4">
                    <Label htmlFor="city" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                      <MapPin className="h-3.5 w-3.5" /> Localitate *
                    </Label>
                    <select
                      id="city"
                      value={city}
                      onChange={(e) => { setCity(e.target.value); update('address', ''); setStreetNumber(''); setStreetSuggestions([]); setShowSuggestions(false); setSelectedSavedIdx(null); }}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {Object.entries(DELIVERY_ZONES).map(([name, zone]) => (
                        <option key={name} value={name}>
                          {name}
                          {zone.deliveryFee > 0
                            ? ` (+${zone.deliveryFee} RON livrare, min ${zone.minOrder} RON)`
                            : ` (livrare gratuită, min ${zone.minOrder} RON)`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Street address — always shown for livrare */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Stradă și număr *</Label>
                    <div className="flex gap-2">
                      {/* Street name with autocomplete */}
                      <div className="relative flex-1" ref={streetRef}>
                        <Input
                          id="address"
                          placeholder="Strada Florilor"
                          value={form.address}
                          onChange={(e) => handleAddressChange(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Tab') setShowSuggestions(false); }}
                          autoComplete="off"
                          required
                        />
                        {showSuggestions && streetSuggestions.length > 0 && (
                          <ul className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-[100] max-h-52 overflow-y-auto divide-y divide-border/50">
                            {streetSuggestions.map((street, i) => (
                              <li
                                key={i}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-secondary transition-colors text-foreground"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  update('address', street);
                                  setShowSuggestions(false);
                                  setTimeout(() => streetNumberRef.current?.focus(), 0);
                                }}
                              >
                                {street}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {/* House number */}
                      <Input
                        ref={streetNumberRef}
                        placeholder="Nr."
                        value={streetNumber}
                        onChange={(e) => setStreetNumber(e.target.value)}
                        className="w-20 shrink-0"
                        aria-label="Număr stradă"
                      />
                    </div>
                  </div>

                  {/* Bloc details toggle */}
                  <div>
                    {!showBlocDetails ? (
                      <button
                        type="button"
                        onClick={() => setShowBlocDetails(true)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        🏢 Completează detalii bloc (bloc, scară, etaj, apartament)
                      </button>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Bloc</Label>
                          <Input placeholder="A1" value={bloc} onChange={(e) => setBloc(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Scară</Label>
                          <Input placeholder="2" value={scara} onChange={(e) => setScara(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Etaj</Label>
                          <Input placeholder="3" value={etaj} onChange={(e) => setEtaj(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Ap.</Label>
                          <Input placeholder="7" value={apt} onChange={(e) => setApt(e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Address preview */}
                  {addressPreview && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {addressPreview}
                    </div>
                  )}
                </div>

                {/* Below-minimum warning */}
                {belowMinimum && minOrder > 0 && (
                  <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p className="text-xs">
                      Comandă minimă: <strong>{minOrder} RON</strong>. Mai adaugă{' '}
                      <strong>{missing.toFixed(0)} RON</strong> din{' '}
                      <Link href="/meniu" className="underline hover:text-amber-900">meniu</Link>.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* 4. Metodă plată */}
            <section className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Metodă de plată</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => update('paymentMethod', 'cash')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    form.paymentMethod === 'cash'
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <Banknote className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Numerar</p>
                    <p className="text-xs opacity-70">La livrare / ridicare</p>
                  </div>
                </button>
                <button
                  type="button"
                  disabled
                  className="relative flex items-center gap-3 p-4 rounded-xl border-2 border-border text-muted-foreground/40 cursor-not-allowed text-left"
                >
                  <CreditCard className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Card online</p>
                    <p className="text-xs opacity-70">Momentan indisponibil</p>
                  </div>
                  <Badge className="absolute top-2 right-2 text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border border-amber-200">
                    În curând
                  </Badge>
                </button>
              </div>
            </section>

            {/* 5. Mențiuni */}
            <section className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Mențiuni (opțional)
              </h2>
              <Textarea
                placeholder="Alergii, preferințe, instrucțiuni speciale..."
                rows={3}
                className="resize-none"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
              />
            </section>

            {/* Loyalty reward banner */}
            {activeReward && currentUser && (
              <section className="bg-card border border-green-500/30 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">🎁</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm mb-1">
                      Ai o comandă gratuită disponibilă!
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Valoare: <strong>{activeReward.rewardValue.toFixed(0)} RON</strong>
                      {activeReward.expiresAt && (
                        <> · Valabilă până pe{' '}
                          <strong>
                            {new Date(activeReward.expiresAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}
                          </strong>
                        </>
                      )}
                    </p>
                    {rewardApplied ? (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                          ✓ Recompensă aplicată — {loyaltyDiscount.toFixed(0)} RON reducere
                        </span>
                        <button
                          type="button"
                          onClick={() => setRewardApplied(false)}
                          className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          Elimină
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRewardApplied(true)}
                        className="text-xs font-semibold px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
                      >
                        Aplică recompensa →
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Wallet credit banner (Level 2+) */}
            {walletBalance > 0 && currentUser && (
              <section className="bg-card rounded-2xl p-5" style={{ border: welcomeBonusBlocked ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(201,168,76,0.2)' }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{welcomeBonusActive ? '🎉' : '💳'}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm mb-1">
                      {welcomeBonusActive
                        ? `Bonus de bun venit — ${walletBalance.toFixed(2)} RON credit!`
                        : `Ai ${walletBalance.toFixed(2)} RON credit în portofel!`}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {welcomeBonusActive
                        ? `Cadou pentru prima comandă cu cod de invitație`
                        : 'Câștigat prin cashback 3%'}
                      {walletExpiresAt && (
                        <> · Valabil până pe{' '}
                          <strong>
                            {new Date(walletExpiresAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}
                          </strong>
                        </>
                      )}
                    </p>
                    {welcomeBonusBlocked ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: '#a78bfa' }} />
                        <p className="text-xs" style={{ color: '#a78bfa' }}>
                          Adaugă produse pentru a ajunge la <strong>{welcomeBonusMinOrderValue} RON</strong> și deblochează bonusul
                        </p>
                      </div>
                    ) : walletCreditApplied ? (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                          ✓ Credit aplicat — {walletCredit.toFixed(2)} RON reducere
                        </span>
                        <button
                          type="button"
                          onClick={() => setWalletCreditApplied(false)}
                          className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          Elimină
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setWalletCreditApplied(true)}
                        className="text-xs font-semibold px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
                      >
                        Folosește creditul →
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              disabled={submitting || (orderType === 'livrare' && belowMinimum) || items.length === 0}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold h-12"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se procesează...
                </span>
              ) : (
                `Plasează comanda →`
              )}
            </Button>
          </div>

          {/* ── Right: order summary ────────────────────────────────────── */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Sumar comandă
                </h2>

                <div className="space-y-3 mb-5 max-h-72 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {item.product.price} RON
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground shrink-0">
                        {(item.product.price * item.quantity).toFixed(0)} RON
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(0)} RON</span>
                  </div>
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Recompensă loialitate</span>
                      <span>-{loyaltyDiscount.toFixed(0)} RON</span>
                    </div>
                  )}
                  {walletCredit > 0 && (
                    <div className="flex justify-between text-sm font-medium" style={{ color: '#C9A84C' }}>
                      <span>Credit portofel</span>
                      <span>-{walletCredit.toFixed(2)} RON</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Livrare</span>
                    {orderType === 'ridicare' ? (
                      <span className="text-green-600 font-medium">GRATUITĂ</span>
                    ) : deliveryMethod === 'gps' && gps.status !== 'success' ? (
                      <span className="italic text-muted-foreground/60">se calculează...</span>
                    ) : (
                      <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                        {deliveryFee === 0 ? 'GRATUITĂ' : `${deliveryFee} RON`}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between font-bold text-foreground text-base pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">{total.toFixed(0)} RON</span>
                  </div>
                </div>

                {orderType === 'livrare' && minOrder > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Comandă minimă: <strong>{minOrder} RON</strong>
                    {deliveryFee > 0 && ` • Livrare: ${deliveryFee} RON`}
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
