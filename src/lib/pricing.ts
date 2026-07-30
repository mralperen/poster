import type { CartItem, FrameOption } from "@/lib/types";

export const STANDARD_POSTER_SIZE_LABEL = "A3 / 29,7 x 42 cm";

/** Çerçevesiz seçeneğinde standart fiyattan düşülecek tutar (₺) */
export const FRAMELESS_DISCOUNT = 100;

/** 3 veya daha fazla posterde yalnızca 1 poster bedava. */
export const BUY_N_GET_FREE_EVERY = 3;

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
};

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  shippingFee: 49,
  freeShippingThreshold: 500,
};

export function normalizePricingConfig(
  input?: Partial<PricingConfig> & {
    bundleSecondPercent?: number;
    bundleThirdPercent?: number;
  },
): PricingConfig {
  return {
    shippingFee: Number.isFinite(input?.shippingFee)
      ? Math.max(0, Number(input?.shippingFee))
      : DEFAULT_PRICING_CONFIG.shippingFee,
    freeShippingThreshold: Number.isFinite(input?.freeShippingThreshold)
      ? Math.max(0, Number(input?.freeShippingThreshold))
      : DEFAULT_PRICING_CONFIG.freeShippingThreshold,
  };
}

export function countDistinctPosters(items: Pick<CartItem, "productId">[]): number {
  return new Set(items.map((item) => item.productId)).size;
}

/** Sepet satırlarını birim fiyat listesine açar (adet kadar tekrar). */
export function expandUnitPrices(
  items: Array<{ unitPrice: number; quantity: number }>,
): number[] {
  const prices: number[] = [];
  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.quantity));
    for (let i = 0; i < qty; i++) {
      prices.push(item.unitPrice);
    }
  }
  return prices;
}

/**
 * 3 al 2 öde: sepette 3+ poster varsa en ucuz 1 poster bedava.
 * Ürün sayısı artsa da ikinci bir ücretsiz poster verilmez.
 */
export function getBuy3Pay2Discount(unitPrices: number[]): {
  freePosterCount: number;
  discountTotal: number;
} {
  if (unitPrices.length < BUY_N_GET_FREE_EVERY) {
    return { freePosterCount: 0, discountTotal: 0 };
  }

  const sorted = [...unitPrices].sort((a, b) => a - b);
  const freePosterCount = 1;
  const discountTotal = sorted[0] ?? 0;

  return { freePosterCount, discountTotal };
}

/** Bundle picker / önizleme için fiyat listesinden 3 al 2 öde. */
export function getBundlePricing(
  unitPrices: number[],
  _config?: Partial<PricingConfig>,
) {
  const rawTotal = unitPrices.reduce((sum, price) => sum + price, 0);
  const { freePosterCount, discountTotal } = getBuy3Pay2Discount(unitPrices);
  const discountRate = rawTotal > 0 ? discountTotal / rawTotal : 0;

  return {
    rawTotal,
    discount: discountTotal,
    discountRate,
    freePosterCount,
    total: rawTotal - discountTotal,
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
  const { freePosterCount, discountTotal } = getBuy3Pay2Discount(
    expandUnitPrices(items),
  );
  const bundleDiscountRate = rawSubtotal > 0 ? discountTotal / rawSubtotal : 0;
  const subtotal = rawSubtotal - discountTotal;
  const shipping = getShippingFee(subtotal, pricing);

  return {
    itemCount,
    distinctPosterCount,
    freePosterCount,
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
