export const DELIVERY_ZONES: Record<string, { minOrder: number; deliveryFee: number }> = {
  Călărași: { minOrder: 50, deliveryFee: 0 },
  Tonea: { minOrder: 150, deliveryFee: 15 },
  Modelu: { minOrder: 200, deliveryFee: 20 },
};

export interface GpsTier {
  fromKm: number;
  toKm: number;
  fee: number;
  minOrder: number;
}

export interface DeliveryValidation {
  valid: boolean;
  deliveryFee: number;
  minOrder: number;
  missing: number;
}

export function validateDelivery(city: string, subtotal: number): DeliveryValidation {
  const zone = DELIVERY_ZONES[city];
  if (!zone) return { valid: false, deliveryFee: 0, minOrder: 0, missing: 0 };
  const missing = Math.max(0, zone.minOrder - subtotal);
  return {
    valid: subtotal >= zone.minOrder,
    deliveryFee: zone.deliveryFee,
    minOrder: zone.minOrder,
    missing,
  };
}

export function validateGpsDelivery(
  distanceKm: number,
  subtotal: number,
  gpsTiers: GpsTier[]
): DeliveryValidation | null {
  const tier = gpsTiers.find((t) => distanceKm >= t.fromKm && distanceKm < t.toKm);
  if (!tier) return null;
  const missing = Math.max(0, tier.minOrder - subtotal);
  return {
    valid: subtotal >= tier.minOrder,
    deliveryFee: tier.fee,
    minOrder: tier.minOrder,
    missing,
  };
}
