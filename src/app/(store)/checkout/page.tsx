"use client";

import Link from "next/link";
import { useState } from "react";
import { savePaySession } from "@/components/CheckoutPayView";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { FRAME_OPTION_LABELS, cartLineKey, normalizeFrameOption } from "@/lib/pricing";

export default function CheckoutPage() {
  const {
    items,
    subtotal,
    rawSubtotal,
    discountTotal,
    bundleDiscountRate,
    shipping,
    total,
  } = useCart();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6 sm:py-20">
        <p className="text-zinc-500">Sepetiniz boş.</p>
        <Link href="/shop" className="mt-4 inline-block text-amber-300">
          Mağazaya dön
        </Link>
      </main>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      customer: {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        address: String(formData.get("address") ?? ""),
        city: String(formData.get("city") ?? ""),
        zip: String(formData.get("zip") ?? ""),
      },
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        frameOption: item.frameOption,
      })),
    };

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Sipariş oluşturulamadı.");

      const paymentUrl =
        typeof data.paymentUrl === "string"
          ? data.paymentUrl
          : data.orderId
            ? `/checkout/pay/${data.orderId}`
            : null;

      if (paymentUrl && typeof data.paytrToken === "string" && data.orderId) {
        savePaySession(data.orderId, {
          token: data.paytrToken,
          total,
        });
        window.location.assign(paymentUrl);
        return;
      }

      throw new Error("Ödeme sayfası açılamadı.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <section>
          <h1 className="text-2xl font-semibold text-white">Ödeme</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Teslimat bilgilerini doldurun; sonraki adımda PayTR güvenli ödeme ekranı
            açılır.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field label="Ad Soyad" name="name" required />
            <Field label="E-posta" name="email" type="email" required />
            <Field label="Telefon" name="phone" required />
            <Field label="Adres" name="address" required />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Şehir" name="city" required />
              <Field label="Posta Kodu" name="zip" required />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-white/10 bg-white/[0.02] p-4">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                required
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40"
              />
              <span className="text-sm leading-6 text-zinc-400">
                <Link href="/terms" className="text-amber-200 hover:underline">
                  Mesafeli satış sözleşmesi
                </Link>
                ni ve ön bilgilendirme formunu okudum, kabul ediyorum.
              </span>
            </label>

            {error && (
              <p className="rounded-[8px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !acceptedTerms}
              className="min-h-12 w-full rounded-full bg-white py-3.5 text-sm font-semibold text-black hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60"
            >
              {submitting
                ? "Ödeme ekranına yönlendiriliyor..."
                : `Ödemeye Geç - ${formatPrice(total)}`}
            </button>
          </form>
        </section>

        <aside className="rounded-[8px] border border-white/10 bg-white/[0.025] p-5 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold text-white">Sipariş özeti</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => {
              const frameOption = normalizeFrameOption(item.frameOption);
              return (
              <div
                key={cartLineKey(item.productId, frameOption)}
                className="flex justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate text-zinc-400">
                  {item.quantity} × {item.name}{" "}
                  <span className="text-zinc-600">
                    ({FRAME_OPTION_LABELS[frameOption]})
                  </span>
                </span>
                <span className="shrink-0 text-zinc-300">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </div>
              );
            })}
          </div>

          <div className="mt-5 space-y-2 border-t border-white/10 pt-5 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Ürünler</span>
              <span>{formatPrice(rawSubtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-emerald-300">
                <span>Paket indirimi (%{Math.round(bundleDiscountRate * 100)})</span>
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
              <span>Ödenecek tutar</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-xs font-medium text-zinc-500 uppercase">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-1.5 w-full rounded-[8px] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-amber-200/40"
      />
    </div>
  );
}
