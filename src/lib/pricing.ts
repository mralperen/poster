import type { CartItem, FrameOption } from "@/lib/types";

export const STANDARD_POSTER_SIZE_LABEL = "A3 / 29,7 x 42 cm";

/** Çerçevesiz seçeneğinde standart fiyattan düşülecek tutar (₺) */
export const FRAMELESS_DISCOUNT = 100;

export const FRAME_OPTION_LABELS: Record<FrameOption, string> = {
  framed: "Çerçeveli",
  frameless: "Çerçevesiz",
};

export function getUnitPrice(
  basePrice: number,
  frameOption: FrameOption = "framed",
): number {
  if (frameOption === "frameless") {
    return Math.max(0, basePrice - FRAMELESS_DISCOUNT);
  }
  return basePrice;
}

export function cartLineKey(
  productId: string,
  frameOption: FrameOption = "framed",
): string {
  return `${productId}:${frameOption}`;
}

export function normalizeFrameOption(value: unknown): FrameOption {
  return value === "frameless" ? "frameless" : "framed";
}

export type PricingConfig = {
  shippingFee: number;
  freeShippingThreshold: number;
  bundleSecondPercent: number;
  bundleThirdPercent: number;
};

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  shippingFee: 49,
  freeShippingThreshold: 500,
  bundleSecondPercent: 10,
  bundleThirdPercent: 15,
};

export function normalizePricingConfig(
  input?: Partial<PricingConfig>,
): PricingConfig {
  return {
    shippingFee: Number.isFinite(input?.shippingFee)
      ? Math.max(0, Number(input?.shippingFee))
      : DEFAULT_PRICING_CONFIG.shippingFee,
    freeShippingThreshold: Number.isFinite(input?.freeShippingThreshold)
      ? Math.max(0, Number(input?.freeShippingThreshold))
      : DEFAULT_PRICING_CONFIG.freeShippingThreshold,
    bundleSecondPercent: Number.isFinite(input?.bundleSecondPercent)
      ? Math.max(0, Math.min(100, Number(input?.bundleSecondPercent)))
      : DEFAULT_PRICING_CONFIG.bundleSecondPercent,
    bundleThirdPercent: Number.isFinite(input?.bundleThirdPercent)
      ? Math.max(0, Math.min(100, Number(input?.bundleThirdPercent)))
      : DEFAULT_PRICING_CONFIG.bundleThirdPercent,
  };
}

export function getBundleDiscountRate(
  distinctPosterCount: number,
  config?: Partial<PricingConfig>,
): number {
  const pricing = normalizePricingConfig(config);
  if (distinctPosterCount >= 3) return pricing.bundleThirdPercent / 100;
  if (distinctPosterCount >= 2) return pricing.bundleSecondPercent / 100;
  return 0;
}

export function countDistinctPosters(items: Pick<CartItem, "productId">[]): number {
  return new Set(items.map((item) => item.productId)).size;
}

export function getBundlePricing(
  unitPrice: number,
  quantity: number,
  config?: Partial<PricingConfig>,
) {
  const rawTotal = unitPrice * quantity;
  // Aynı posterden birden fazla adet — set indirimi yok.
  void config;

  return {
    rawTotal,
    discount: 0,
    discountRate: 0,
    total: rawTotal,
  };
}

export function getCartPricing(
  items: CartItem[],
  config?: Partial<PricingConfig>,
) {
  const pricing = normalizePricingConfig(config);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const distinctPosterCount = countDistinctPosters(items);
  const rawSubtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const bundleDiscountRate = getBundleDiscountRate(distinctPosterCount, pricing);
  const discountTotal = Math.round(rawSubtotal * bundleDiscountRate);
  const subtotal = rawSubtotal - discountTotal;
  const shipping = getShippingFee(subtotal, pricing);

  return {
    itemCount,
    distinctPosterCount,
    rawSubtotal,
    bundleDiscountRate,
    discountTotal,
    subtotal,
    shipping,
    total: subtotal + shipping,
    freeShippingRemaining: getFreeShippingRemaining(subtotal, pricing),
    pricing,
  };
}

export function getShippingFee(
  subtotal: number,
  config?: Partial<PricingConfig>,
): number {
  const pricing = normalizePricingConfig(config);
  if (subtotal <= 0) return 0;
  return subtotal >= pricing.freeShippingThreshold ? 0 : pricing.shippingFee;
}

export function getFreeShippingRemaining(
  subtotal: number,
  config?: Partial<PricingConfig>,
): number {
  const pricing = normalizePricingConfig(config);
  return Math.max(0, pricing.freeShippingThreshold - subtotal);
}
