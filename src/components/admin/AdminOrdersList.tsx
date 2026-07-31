"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { OrderStatus, StoredOrder } from "@/lib/db/orders-store";
import { formatPrice } from "@/lib/format";

const statusLabels: Record<OrderStatus, string> = {
  pending_payment: "Ödeme bekliyor",
  paid: "Ödendi",
  failed: "İptal",
  fulfilled: "Kargolandı",
  refunded: "İade",
};

const statusStyles: Record<OrderStatus, string> = {
  pending_payment: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  paid: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  failed: "border-red-300/25 bg-red-300/10 text-red-200",
  fulfilled: "border-sky-300/25 bg-sky-300/10 text-sky-100",
  refunded: "border-zinc-400/25 bg-zinc-400/10 text-zinc-300",
};

type OrderFilter = "pending" | "completed" | "cancelled";

const filters: Array<{ key: OrderFilter; label: string }> = [
  { key: "pending", label: "Ödeme bekleniyor" },
  { key: "completed", label: "Tamamlandı" },
  { key: "cancelled", label: "İptal / iade" },
];

function formatOrderDate(value: string): string {
  return new Date(value).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function orderRef(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function matchesFilter(order: StoredOrder, filter: OrderFilter): boolean {
  if (filter === "pending") return order.status === "pending_payment";
  if (filter === "completed") return order.status === "paid" || order.status === "fulfilled";
  return order.status === "failed" || order.status === "refunded";
}

type AdminOrdersListProps = {
  orders: StoredOrder[];
};

export function AdminOrdersList({ orders }: AdminOrdersListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<OrderFilter>("pending");
  const [clearing, setClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState("");
  const [clearError, setClearError] = useState("");
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
  const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>({});
  const [shipMessage, setShipMessage] = useState("");
  const [shipError, setShipError] = useState("");

  const counts = useMemo(
    () => ({
      pending: orders.filter((order) => matchesFilter(order, "pending")).length,
      completed: orders.filter((order) => matchesFilter(order, "completed")).length,
      cancelled: orders.filter((order) => matchesFilter(order, "cancelled")).length,
    }),
    [orders],
  );

  const visibleOrders = orders.filter((order) => matchesFilter(order, filter));

  const clearSales = async () => {
    const confirmed = window.confirm(
      "Tüm siparişler, satış istatistikleri ve ödeme bildirimleri kalıcı olarak silinecek. Emin misiniz?",
    );
    if (!confirmed) return;

    setClearing(true);
    setClearMessage("");
    setClearError("");

    try {
      const response = await fetch("/api/admin/sales/clear", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Temizlenemedi.");
      }
      setClearMessage(
        `Temizlendi: ${data.ordersCleared ?? 0} sipariş, ${data.callbacksCleared ?? 0} ödeme kaydı.`,
      );
      router.refresh();
    } catch (err) {
      setClearError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    if (counts.pending === 0) return;

    const timer = window.setInterval(() => {
      router.refresh();
    }, 8000);

    return () => window.clearInterval(timer);
  }, [counts.pending, router]);

  const shipOrder = async (orderId: string) => {
    setShippingOrderId(orderId);
    setShipMessage("");
    setShipError("");

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: trackingNumbers[orderId]?.trim() || undefined,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        emailSent?: boolean;
        emailError?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Kargo bildirimi gönderilemedi.");
      }

      if (data.emailSent === false) {
        setShipError(
          data.emailError ??
            "Sipariş kargolandı olarak işaretlendi ancak e-posta gönderilemedi.",
        );
      } else {
        setShipMessage("Müşteriye kargo bildirimi e-postası gönderildi.");
      }

      router.refresh();
    } catch (err) {
      setShipError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setShippingOrderId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Siparişler</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {orders.length} sipariş · {counts.completed} tamamlandı · {counts.pending}{" "}
            bekliyor
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={clearSales}
            disabled={clearing || orders.length === 0}
            className="rounded-lg border border-red-400/30 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {clearing ? "Temizleniyor…" : "Satışları temizle"}
          </button>
          <Link
            href="/admin/payments"
            className="w-fit rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:text-white"
          >
            Ödeme ayarları
          </Link>
        </div>
      </div>

      {clearMessage ? (
        <p className="mt-4 rounded-[8px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {clearMessage}
        </p>
      ) : null}
      {clearError ? (
        <p className="mt-4 rounded-[8px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {clearError}
        </p>
      ) : null}
      {shipMessage ? (
        <p className="mt-4 rounded-[8px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {shipMessage}
        </p>
      ) : null}
      {shipError ? (
        <p className="mt-4 rounded-[8px] border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {shipError}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((item) => {
          const count = counts[item.key];
          const active = filter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-white/30 bg-white text-black"
                  : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {item.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        {visibleOrders.length === 0 ? (
          <div className="rounded-[8px] border border-white/10 bg-white/[0.025] p-8 text-center text-sm text-zinc-500">
            Bu kategoride sipariş yok.
          </div>
        ) : (
          visibleOrders.map((order) => (
            <article
              key={order.id}
              className="rounded-[8px] border border-white/10 bg-white/[0.025] p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-semibold text-white">
                      #{orderRef(order.id)}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyles[order.status]}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">{order.customer.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {order.customer.phone} · {order.customer.email}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {formatOrderDate(order.createdAt)}
                  </p>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-xl font-semibold tabular-nums text-white">
                    {formatPrice(order.totals.total)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} ürün
                  </p>
                </div>
              </div>

              <details className="mt-4 border-t border-white/8 pt-3">
                <summary className="cursor-pointer text-xs font-medium text-zinc-400 hover:text-zinc-200">
                  Teslimat ve ürün detayı
                </summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <p className="text-sm leading-6 text-zinc-400">
                    {order.customer.address}
                    <br />
                    {order.customer.city}
                    {order.customer.zip ? ` · ${order.customer.zip}` : ""}
                  </p>
                  <ul className="space-y-1 text-sm text-zinc-400">
                    {order.items.map((item) => (
                      <li key={`${item.productId}-${item.frameOption ?? "framed"}`}>
                        {item.quantity}× {item.name}
                        {item.frameOption === "frameless"
                          ? " (Çerçevesiz)"
                          : " (Çerçeveli)"}{" "}
                        — {formatPrice(item.unitPrice * item.quantity)}
                      </li>
                    ))}
                  </ul>
                </div>
              </details>

              {order.status === "paid" ? (
                <div className="mt-4 border-t border-white/8 pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Kargoya ver
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="flex-1">
                      <span className="mb-1.5 block text-xs text-zinc-500">
                        Takip numarası (isteğe bağlı)
                      </span>
                      <input
                        type="text"
                        value={trackingNumbers[order.id] ?? ""}
                        onChange={(event) =>
                          setTrackingNumbers((current) => ({
                            ...current,
                            [order.id]: event.target.value,
                          }))
                        }
                        placeholder="Örn. 1234567890"
                        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void shipOrder(order.id)}
                      disabled={shippingOrderId === order.id}
                      className="rounded-lg bg-sky-400/15 px-4 py-2 text-sm font-medium text-sky-100 ring-1 ring-sky-300/25 transition-colors hover:bg-sky-400/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {shippingOrderId === order.id
                        ? "Gönderiliyor…"
                        : "Kargoya ver ve müşteriye bildir"}
                    </button>
                  </div>
                </div>
              ) : null}

              {order.status === "fulfilled" ? (
                <div className="mt-4 border-t border-white/8 pt-4 text-sm text-zinc-400">
                  <p>
                    Kargoya verildi
                    {order.shippedAt
                      ? ` · ${formatOrderDate(order.shippedAt)}`
                      : ""}
                  </p>
                  {order.trackingNumber ? (
                    <p className="mt-1 font-mono text-sky-200">
                      Takip no: {order.trackingNumber}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
