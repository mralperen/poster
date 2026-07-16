"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

type ProductMobileBarProps = {
  product: Product;
};

export function ProductMobileBar({ product }: ProductMobileBarProps) {
  const router = useRouter();
  const { addItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleBuyNow = () => {
    if (loading) return;

    setLoading(true);
    clearCart();
    addItem(product, 1);
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#09090a]/95 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{product.name}</p>
          <p className="text-sm text-amber-300">
            {formatPrice(product.basePrice)}
            <span className="ml-1 text-xs text-zinc-500">
              / çerçeveli
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={loading}
          className="shrink-0 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-opacity active:bg-amber-100 disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? "Yönlendiriliyor…" : "Satın Al"}
        </button>
      </div>
    </div>
  );
}
