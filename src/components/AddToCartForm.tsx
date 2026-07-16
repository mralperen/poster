"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BundlePicker } from "@/components/BundlePicker";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import {
  FRAME_OPTION_LABELS,
  FRAMELESS_DISCOUNT,
  getUnitPrice,
  normalizePricingConfig,
  type PricingConfig,
} from "@/lib/pricing";
import type { FrameOption, Product } from "@/lib/types";

type AddToCartFormProps = {
  product: Product;
  relatedProducts?: Product[];
  pricing?: Partial<PricingConfig>;
};

export function AddToCartForm({
  product,
  relatedProducts = [],
  pricing,
}: AddToCartFormProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [frameOption, setFrameOption] = useState<FrameOption>("framed");
  const [addedMessage, setAddedMessage] = useState("");

  const pricingConfig = normalizePricingConfig(pricing);
  const bundleOptions = relatedProducts;
  const unitPrice = getUnitPrice(product.basePrice, frameOption);
  const total = unitPrice * quantity;

  const showAdded = (message: string) => {
    setAddedMessage(message);
    window.setTimeout(() => setAddedMessage(""), 2000);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    addItem(product, quantity, frameOption);
    showAdded("Sepete eklendi");
  };

  const handleBundleAdd = (bundleProducts: Product[]) => {
    addItem(product, 1, frameOption);
    bundleProducts.forEach((bundleProduct) =>
      addItem(bundleProduct, 1, "framed"),
    );
    router.push("/cart");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
          Çerçeve
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              {
                value: "framed" as const,
                hint: "Standart",
                price: getUnitPrice(product.basePrice, "framed"),
                discountLabel: null as string | null,
              },
              {
                value: "frameless" as const,
                hint: null,
                price: getUnitPrice(product.basePrice, "frameless"),
                discountLabel: `−${FRAMELESS_DISCOUNT} ₺`,
              },
            ] as const
          ).map((option) => {
            const selected = frameOption === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFrameOption(option.value)}
                className={`rounded-[8px] border px-3 py-3 text-left transition-colors ${
                  selected
                    ? "border-amber-300/60 bg-amber-300/10"
                    : "border-white/12 bg-black/30 hover:border-white/25"
                }`}
              >
                <span className="block text-sm font-semibold text-white">
                  {FRAME_OPTION_LABELS[option.value]}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                  {option.discountLabel ? (
                    <span className="rounded bg-amber-300/15 px-1.5 py-0.5 font-semibold text-amber-300">
                      {option.discountLabel}
                    </span>
                  ) : (
                    <span className="text-zinc-500">{option.hint}</span>
                  )}
                  <span className="font-medium text-zinc-300">
                    {formatPrice(option.price)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            Adet
          </p>
          <div className="mt-2 inline-flex items-center rounded-[10px] border border-white/12 bg-black/30 p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Adedi azalt"
              className="flex h-10 w-10 items-center justify-center rounded-[8px] text-lg text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
              disabled={quantity <= 1}
            >
              −
            </button>
            <span
              className="min-w-10 px-2 text-center text-base font-semibold tabular-nums text-white"
              aria-live="polite"
              aria-label={`Seçilen adet: ${quantity}`}
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Adedi artır"
              className="flex h-10 w-10 items-center justify-center rounded-[8px] text-lg text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              +
            </button>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            Toplam
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
            {formatPrice(total)}
          </p>
          {quantity > 1 && (
            <p className="mt-1 text-[11px] text-zinc-600">
              {formatPrice(unitPrice)} / adet
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        className={`min-h-12 w-full rounded-[8px] py-3.5 text-sm font-semibold transition-colors active:scale-[0.99] ${
          addedMessage
            ? "bg-amber-200 text-black"
            : "bg-white text-black hover:bg-amber-100"
        }`}
      >
        {addedMessage || "Sepete Ekle"}
      </button>

      {bundleOptions.length > 0 && (
        <BundlePicker
          current={product}
          options={bundleOptions}
          pricing={pricingConfig}
          onAdd={handleBundleAdd}
        />
      )}
    </form>
  );
}
