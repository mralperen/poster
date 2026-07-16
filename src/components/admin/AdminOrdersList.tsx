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

  const counts = useMemo(
    () => ({
      pending: orders.filter((order) => matchesFilter(order, "pending")).length,
      completed: orders.filter((order) => matchesFilter(order, "completed")).length,
      cancelled: orders.filter((order) => matchesFilter(order, "cancelled")).length,
    }),
    [orders],
  );

  const visibleOrders = orders.filter((order) => matchesFilter(order, filter));

  useEffect(() => {
    if (counts.pending === 0) return;

    const timer = window.setInterval(() => {
      router.refresh();
    }, 8000);

    return () => window.clearInterval(timer);
  }, [counts.pending, router]);

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
        <Link
          href="/admin/payments"
          className="w-fit rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:text-white"
        >
          Ödeme ayarları
        </Link>
      </div>

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
            </article>
          ))
        )}
      </div>
    </div>
  );
}
