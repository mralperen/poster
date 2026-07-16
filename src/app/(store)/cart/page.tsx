"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import {
  FRAME_OPTION_LABELS,
  cartLineKey,
  normalizeFrameOption,
  STANDARD_POSTER_SIZE_LABEL,
} from "@/lib/pricing";

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    subtotal,
    rawSubtotal,
    discountTotal,
    bundleDiscountRate,
    itemCount,
    distinctPosterCount,
    shipping,
    total,
    freeShippingRemaining,
  } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <h1 className="text-2xl font-semibold text-white">Sepetiniz boş</h1>
        <p className="mt-2 text-sm text-zinc-500">
          3D lentiküler poster koleksiyonunu keşfetmeye başlayın.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex min-h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-amber-100"
        >
          Mağazaya Git
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Sepet <span className="text-zinc-600">({itemCount} ürün)</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Paket indirimi ve kargo ücreti otomatik hesaplanır.
          </p>
        </div>
        <Link href="/shop" className="text-sm text-amber-300 hover:text-amber-100">
          Alışverişe devam et
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-4">
          {items.map((item) => {
            const frameOption = normalizeFrameOption(item.frameOption);
            return (
            <div
              key={cartLineKey(item.productId, frameOption)}
              className="flex gap-4 rounded-[8px] border border-white/10 bg-white/[0.025] p-4 sm:gap-6"
            >
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[8px] bg-zinc-950">
                <Image
                  src={item.thumbnail}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <Link
                    href={`/product/${item.slug}`}
                    className="font-medium text-white hover:text-amber-50"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500">
                    {FRAME_OPTION_LABELS[frameOption]} ·{" "}
                    {STANDARD_POSTER_SIZE_LABEL}
                  </p>
                  <p className="mt-1 text-sm text-amber-300">
                    {formatPrice(item.unitPrice)}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Adedi azalt"
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity - 1,
                          frameOption,
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-white/10 text-zinc-400"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Adedi artır"
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity + 1,
                          frameOption,
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-white/10 text-zinc-400"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId, frameOption)}
                    className="text-xs text-zinc-600 hover:text-red-300"
                  >
                    Kaldır
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        <aside className="rounded-[8px] border border-white/10 bg-white/[0.025] p-5 lg:sticky lg:top-24">
          {distinctPosterCount < 2 ? (
            <div className="mb-5 rounded-[8px] border border-amber-200/20 bg-amber-300/10 p-4 text-sm text-amber-50">
              <p>
                Yanına farklı bir poster ekleyin, set indirimi otomatik açılsın.
              </p>
              <Link
                href="/shop"
                className="mt-3 inline-flex rounded-full bg-amber-200 px-3 py-2 text-xs font-semibold text-black"
              >
                Poster seç
              </Link>
            </div>
          ) : discountTotal > 0 ? (
            <div className="mb-5 rounded-[8px] border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">
              Farklı poster set indirimi aktif: %{Math.round(bundleDiscountRate * 100)}{" "}
              ({formatPrice(discountTotal)} tasarruf)
            </div>
          ) : null}

          {freeShippingRemaining > 0 ? (
            <div className="mb-5 rounded-[8px] border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium text-white">
                Ücretsiz kargoya {formatPrice(freeShippingRemaining)} kaldı
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-amber-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (subtotal / (subtotal + freeShippingRemaining)) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="mb-5 rounded-[8px] border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">
              Ücretsiz kargo açıldı.
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Ürünler</span>
              <span>{formatPrice(rawSubtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-emerald-300">
                <span>Paket indirimi</span>
                <span>-{formatPrice(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400">
              <span>Ara toplam</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Kargo</span>
              <span>{shipping === 0 ? "Ücretsiz" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-3 text-lg font-semibold text-white">
              <span>Toplam</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="mt-6 block min-h-12 w-full rounded-full bg-white py-3.5 text-center text-sm font-semibold text-black hover:bg-amber-100"
          >
            Ödemeye Geç
          </Link>
        </aside>
      </div>
    </main>
  );
}
