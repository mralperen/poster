"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_PRICING_CONFIG,
  cartLineKey,
  getCartPricing,
  getUnitPrice,
  normalizeFrameOption,
  normalizePricingConfig,
  type PricingConfig,
} from "@/lib/pricing";
import type { CartItem, FrameOption, Product } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  addItem: (
    product: Product,
    quantity?: number,
    frameOption?: FrameOption,
  ) => void;
  removeItem: (productId: string, frameOption?: FrameOption) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    frameOption?: FrameOption,
  ) => void;
  clearCart: () => void;
  itemCount: number;
  distinctPosterCount: number;
  rawSubtotal: number;
  discountTotal: number;
  bundleDiscountRate: number;
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingRemaining: number;
  pricing: PricingConfig;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "theposterist-cart-v2";

function normalizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  const grouped = new Map<string, CartItem>();

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Partial<CartItem>;
    if (
      !item.productId ||
      !item.slug ||
      !item.name ||
      !item.thumbnail ||
      typeof item.quantity !== "number" ||
      typeof item.unitPrice !== "number"
    ) {
      continue;
    }

    const frameOption = normalizeFrameOption(item.frameOption);
    const key = cartLineKey(item.productId, frameOption);
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += item.quantity;
      continue;
    }

    grouped.set(key, {
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      thumbnail: item.thumbnail,
      frameOption,
    });
  }

  return Array.from(grouped.values());
}

export function CartProvider({
  children,
  pricing = DEFAULT_PRICING_CONFIG,
}: {
  children: React.ReactNode;
  pricing?: Partial<PricingConfig>;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const pricingConfig = useMemo(() => normalizePricingConfig(pricing), [pricing]);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored =
          localStorage.getItem(STORAGE_KEY) ??
          localStorage.getItem("theposterist-cart");
        if (stored) setItems(normalizeCartItems(JSON.parse(stored)));
      } catch {
        /* ignore */
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback(
    (product: Product, quantity = 1, frameOption: FrameOption = "framed") => {
      const option = normalizeFrameOption(frameOption);
      const unitPrice = getUnitPrice(product.basePrice, option);

      setItems((prev) => {
        const existing = prev.find(
          (i) => i.productId === product.id && i.frameOption === option,
        );
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id && i.frameOption === option
              ? { ...i, quantity: i.quantity + quantity, unitPrice }
              : i,
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            quantity,
            unitPrice,
            thumbnail: product.thumbnail,
            frameOption: option,
          },
        ];
      });
    },
    [],
  );

  const removeItem = useCallback(
    (productId: string, frameOption: FrameOption = "framed") => {
      const option = normalizeFrameOption(frameOption);
      setItems((prev) =>
        prev.filter(
          (i) => !(i.productId === productId && i.frameOption === option),
        ),
      );
    },
    [],
  );

  const updateQuantity = useCallback(
    (
      productId: string,
      quantity: number,
      frameOption: FrameOption = "framed",
    ) => {
      if (quantity < 1) {
        removeItem(productId, frameOption);
        return;
      }
      const option = normalizeFrameOption(frameOption);
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.frameOption === option
            ? { ...i, quantity }
            : i,
        ),
      );
    },
    [removeItem],
  );

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const totals = getCartPricing(items, pricingConfig);
    return {
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      ...totals,
    };
  }, [items, addItem, removeItem, updateQuantity, clearCart, pricingConfig]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
