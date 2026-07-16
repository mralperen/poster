"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PaytrIframe } from "@/components/PaytrIframe";
import { formatPrice } from "@/lib/format";

const PAYTR_SESSION_PREFIX = "paytr_session_";

type PaySession = {
  token: string;
  total: number;
};

type CheckoutPayViewProps = {
  orderId: string;
};

function readPaySession(orderId: string): PaySession | null {
  try {
    const raw = sessionStorage.getItem(`${PAYTR_SESSION_PREFIX}${orderId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PaySession>;
    if (typeof parsed.token !== "string" || !parsed.token) return null;
    if (typeof parsed.total !== "number") return null;
    return { token: parsed.token, total: parsed.total };
  } catch {
    return null;
  }
}

export function CheckoutPayView({ orderId }: CheckoutPayViewProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function resolvePayment() {
      const cached = readPaySession(orderId);
      if (cached) {
        setToken(cached.token);
        setTotal(cached.total);
        setLoading(false);
        return;
      }

      for (let attempt = 0; attempt < 12; attempt++) {
        if (cancelled) return;

        try {
          const response = await fetch(`/api/checkout/pay/${orderId}`, {
            cache: "no-store",
          });
          const data = await response.json();

          if (typeof data.redirect === "string") {
            router.replace(data.redirect);
            return;
          }

          if (response.ok && typeof data.token === "string") {
            setToken(data.token);
            setTotal(typeof data.total === "number" ? data.total : 0);
            setLoading(false);
            return;
          }

          if (response.status !== 404) {
            setError(data.error ?? "Ödeme ekranı açılamadı.");
            setLoading(false);
            return;
          }
        } catch {
          setError("Bağlantı hatası. Lütfen tekrar deneyin.");
          setLoading(false);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      if (!cancelled) {
        setError("Sipariş kaydı henüz hazır değil. Sayfayı yenileyin veya birkaç saniye bekleyin.");
        setLoading(false);
      }
    }

    void resolvePayment();

    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-amber-300" />
        <p className="mt-5 text-sm text-zinc-400">PayTR ödeme ekranı hazırlanıyor…</p>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-white">Ödeme başlatılamadı</h1>
        <p className="mt-3 text-sm text-zinc-500">{error || "Bilinmeyen hata."}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black"
          >
            Tekrar dene
          </button>
          <Link
            href="/checkout"
            className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-zinc-300"
          >
            Ödemeye dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase">
          Güvenli ödeme
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">PayTR ile öde</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Sipariş no{" "}
          <span className="font-mono text-zinc-400">{orderId.slice(0, 8)}</span>
          {total !== null ? ` · ${formatPrice(total)}` : ""}
        </p>
      </div>

      <PaytrIframe token={token} />

      <p className="mt-4 text-center text-xs text-zinc-600">
        Kart bilgileriniz The Posterist sunucusunda saklanmaz; işlem PayTR güvenli ödeme
        altyapısı üzerinden tamamlanır.
      </p>
    </div>
  );
}

export function savePaySession(orderId: string, session: PaySession): void {
  sessionStorage.setItem(`${PAYTR_SESSION_PREFIX}${orderId}`, JSON.stringify(session));
}

export function clearPaySession(orderId: string): void {
  sessionStorage.removeItem(`${PAYTR_SESSION_PREFIX}${orderId}`);
}
