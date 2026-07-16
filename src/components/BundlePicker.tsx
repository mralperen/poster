"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import { getBundleDiscountRate, type PricingConfig } from "@/lib/pricing";
import type { Product } from "@/lib/types";

type BundlePickerProps = {
  current: Product;
  options: Product[];
  pricing: PricingConfig;
  onAdd: (extras: Product[]) => void;
};

const MAX_EXTRAS = 2;

export function BundlePicker({
  current,
  options,
  pricing,
  onAdd,
}: BundlePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedProducts = useMemo(
    () => options.filter((item) => selectedIds.includes(item.id)),
    [options, selectedIds],
  );

  const setItems = [current, ...selectedProducts];
  const setCount = setItems.length;
  const rawTotal = setItems.reduce((sum, item) => sum + item.basePrice, 0);
  const discountRate = getBundleDiscountRate(setCount, pricing);
  const savings = Math.round(rawTotal * discountRate);
  const total = rawTotal - savings;
  const canAdd = selectedIds.length > 0;

  const progress =
    selectedIds.length >= 2 ? 100 : selectedIds.length === 1 ? 66 : 33;
  const progressLabel =
    selectedIds.length >= 2
      ? "Maksimum set indirimi"
      : selectedIds.length === 1
        ? "1 poster daha eklersen %15"
        : "1 poster seç";

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= MAX_EXTRAS) return prev;
      return [...prev, id];
    });
  };

  return (
    <div className="overflow-hidden rounded-[10px] border border-amber-300/30 bg-gradient-to-b from-amber-400/[0.14] to-transparent">
      <div className="border-b border-amber-300/20 px-4 py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-amber-200 uppercase">
              Set indirimi
            </p>
            <h3 className="mt-1 text-base font-semibold text-white">
              Kendi setini oluştur
            </h3>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <span className="rounded-full bg-amber-300 px-2.5 py-1 text-[11px] font-bold text-black">
              2 farklı %{pricing.bundleSecondPercent}
            </span>
            <span className="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold text-emerald-100">
              3+ farklı %{pricing.bundleThirdPercent}
            </span>
          </div>
        </div>

        <p className="mt-2 text-xs leading-5 text-amber-100/75">
          Farklı posterlerden seç — indirim sepette otomatik uygulanır.
        </p>

        <div className="mt-3 flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-black text-black">
            {setCount}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold tracking-wide text-amber-100/90 uppercase">
            {progressLabel}
          </span>
        </div>
      </div>

      <div className="p-3">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="bundle-picker-trigger flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-amber-300/35 bg-amber-300/10 px-4 text-sm font-semibold text-amber-100 transition-all hover:border-amber-300/55 hover:bg-amber-300/15"
          >
            <span className="text-base">+</span>
            Poster seç, set indirimini aç
          </button>
        ) : (
          <div className="bundle-picker-open space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-zinc-400">
                En fazla 2 poster daha seçebilirsin
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSelectedIds([]);
                }}
                className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Kapat
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <LockedPosterCard product={current} />

              {options.map((item, index) => {
                const selected = selectedIds.includes(item.id);
                const disabled =
                  !selected && selectedIds.length >= MAX_EXTRAS;

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleProduct(item.id)}
                    className={`bundle-picker-card group relative overflow-hidden rounded-[8px] border text-left transition-all duration-300 ${
                      selected
                        ? "border-amber-300/70 bg-amber-300/10 shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_12px_30px_rgba(0,0,0,0.35)] scale-[1.02]"
                        : disabled
                          ? "cursor-not-allowed border-white/5 bg-black/20 opacity-40"
                          : "border-white/10 bg-black/25 hover:border-amber-300/35 hover:bg-black/35"
                    }`}
                    style={{ animationDelay: `${index * 55}ms` }}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950">
                      <Image
                        src={item.thumbnail}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 45vw, 120px"
                      />
                      <div
                        className={`absolute inset-0 transition-colors ${
                          selected ? "bg-amber-300/10" : "bg-black/20"
                        }`}
                      />
                      <span
                        className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold transition-all ${
                          selected
                            ? "border-amber-300 bg-amber-300 text-black scale-100"
                            : "border-white/25 bg-black/50 text-transparent scale-90 group-hover:border-white/40"
                        }`}
                        aria-hidden
                      >
                        ✓
                      </span>
                    </div>
                    <div className="space-y-0.5 p-2">
                      <p className="truncate text-[11px] font-medium text-white">
                        {item.name}
                      </p>
                      <p className="text-[11px] font-semibold text-amber-300">
                        {formatPrice(item.basePrice)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {canAdd && (
              <div className="bundle-picker-summary rounded-[8px] border border-white/10 bg-black/30 p-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
                      Seçilen set ({setCount} poster)
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-zinc-500 line-through">
                        {formatPrice(rawTotal)}
                      </span>
                      <span className="text-lg font-bold text-white">
                        {formatPrice(total)}
                      </span>
                      <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                        {formatPrice(savings)} kazan
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAdd(selectedProducts)}
                  className="mt-3 min-h-11 w-full rounded-[8px] bg-amber-300 text-sm font-bold text-black transition-colors hover:bg-amber-200 active:scale-[0.99]"
                >
                  Seti sepete ekle — {formatPrice(savings)} indirim
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LockedPosterCard({ product }: { product: Product }) {
  return (
    <div className="relative overflow-hidden rounded-[8px] border border-amber-300/40 bg-amber-300/[0.08]">
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950">
        <Image
          src={product.thumbnail}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 45vw, 120px"
        />
        <span className="absolute top-2 left-2 rounded-full bg-amber-300 px-2 py-0.5 text-[9px] font-bold text-black uppercase">
          Bu poster
        </span>
      </div>
      <div className="space-y-0.5 p-2">
        <p className="truncate text-[11px] font-medium text-white">{product.name}</p>
        <p className="text-[11px] font-semibold text-amber-300">
          {formatPrice(product.basePrice)}
        </p>
      </div>
    </div>
  );
}
