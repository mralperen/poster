"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AdminDashboardData } from "@/lib/admin-dashboard-stats";
import type { OrderStatus } from "@/lib/db/orders-store";
import { formatPrice } from "@/lib/format";

const PANELS = [
  { id: "orders", label: "Siparişler" },
  { id: "inbox", label: "Gelen kutusu" },
  { id: "products", label: "Ürünler" },
  { id: "reviews", label: "Yorumlar" },
  { id: "system", label: "Sistem" },
] as const;

type PanelId = (typeof PANELS)[number]["id"];

const orderStatusLabels: Record<OrderStatus, string> = {
  pending_payment: "Ödeme bekliyor",
  paid: "Ödendi",
  fulfilled: "Tamamlandı",
  failed: "Başarısız",
  refunded: "İade",
};

const orderStatusColors: Record<OrderStatus, string> = {
  pending_payment: "text-amber-300 bg-amber-300/10",
  paid: "text-emerald-300 bg-emerald-300/10",
  fulfilled: "text-sky-300 bg-sky-300/10",
  failed: "text-red-300 bg-red-300/10",
  refunded: "text-zinc-400 bg-white/5",
};

type AdminDashboardProps = {
  data: AdminDashboardData;
};

export function AdminDashboard({ data }: AdminDashboardProps) {
  const [activePanel, setActivePanel] = useState<PanelId>("orders");
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);

  const nextPanel = useCallback(() => {
    setActivePanel((current) => {
      const index = PANELS.findIndex((panel) => panel.id === current);
      return PANELS[(index + 1) % PANELS.length].id;
    });
    setTick((value) => value + 1);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(nextPanel, 5500);
    return () => window.clearInterval(timer);
  }, [paused, nextPanel]);

  const statCards = [
    {
      label: "Toplam gelir",
      value: formatPrice(data.stats.revenueTotal),
      hint: `Bu ay ${formatPrice(data.stats.revenueThisMonth)}`,
      alert: false,
      href: "/admin/orders",
    },
    {
      label: "Bekleyen sipariş",
      value: String(data.stats.ordersPending),
      hint: `${data.stats.ordersPaid} ödendi · ${data.stats.ordersFulfilled} tamamlandı`,
      alert: data.stats.ordersPending > 0,
      href: "/admin/orders",
    },
    {
      label: "Ürünler",
      value: String(data.stats.productsTotal),
      hint: `${data.stats.productsLive} yayında · ${data.stats.productsDraft} taslak`,
      alert: false,
      href: "/admin/products",
    },
    {
      label: "Gelen e-posta",
      value: String(data.stats.inboxTotal),
      hint:
        data.stats.unreadEmails > 0
          ? `${data.stats.unreadEmails} okunmamış`
          : `${data.stats.sentEmails} gönderildi`,
      alert: data.stats.unreadEmails > 0,
      href: "/admin/emails",
    },
    {
      label: "Yorumlar",
      value: String(data.stats.reviewsTotal),
      hint:
        data.stats.reviewsPending > 0
          ? `${data.stats.reviewsPending} onay bekliyor`
          : data.stats.avgRating > 0
            ? `Ort. ${data.stats.avgRating.toFixed(1)} ★`
            : "Henüz yorum yok",
      alert: data.stats.reviewsPending > 0,
      href: "/admin/reviews",
    },
    {
      label: "PayTR bildirimi",
      value: String(data.stats.callbacksTotal),
      hint: data.system.testMode ? "Test modu açık" : "Canlı mod",
      alert: !data.system.paytr,
      href: "/admin/payments",
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-300/80">
            Kontrol paneli
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Özet</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Mağaza aktivitesi ve sistem durumu tek ekranda.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickLink href="/admin/products/new" accent>
            + Yeni poster
          </QuickLink>
          <QuickLink href="/admin/orders">Siparişler</QuickLink>
          <QuickLink href="/admin/emails">E-postalar</QuickLink>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card, index) => (
          <Link
            key={card.label}
            href={card.href}
            className={`admin-stat-card group ${card.alert ? "admin-stat-card--alert" : ""}`}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                {card.label}
              </p>
              <span className="text-zinc-600 transition-colors group-hover:text-amber-300">→</span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{card.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{card.hint}</p>
          </Link>
        ))}
      </div>

      <div
        className="admin-panel-shell mt-8"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap gap-2">
            {PANELS.map((panel) => (
              <button
                key={panel.id}
                type="button"
                onClick={() => {
                  setActivePanel(panel.id);
                  setTick((value) => value + 1);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  activePanel === panel.id
                    ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                    : "border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                }`}
              >
                {panel.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const index = PANELS.findIndex((panel) => panel.id === activePanel);
                const prev = PANELS[(index - 1 + PANELS.length) % PANELS.length];
                setActivePanel(prev.id);
                setTick((value) => value + 1);
              }}
              className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-500 hover:text-white"
              aria-label="Önceki panel"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={nextPanel}
              className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-500 hover:text-white"
              aria-label="Sonraki panel"
            >
              ›
            </button>
          </div>
        </div>

        <div className="relative min-h-[320px] overflow-hidden p-4 sm:p-5">
          <div key={`${activePanel}-${tick}`} className="admin-panel-content">
            {activePanel === "orders" && <OrdersPanel data={data} />}
            {activePanel === "inbox" && <InboxPanel data={data} />}
            {activePanel === "products" && <ProductsPanel data={data} />}
            {activePanel === "reviews" && <ReviewsPanel data={data} />}
            {activePanel === "system" && <SystemPanel data={data} />}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 border-t border-white/8 px-4 py-3">
          {PANELS.map((panel) => (
            <button
              key={panel.id}
              type="button"
              onClick={() => {
                setActivePanel(panel.id);
                setTick((value) => value + 1);
              }}
              className={`h-1.5 rounded-full transition-all ${
                activePanel === panel.id
                  ? "w-6 bg-amber-300"
                  : "w-1.5 bg-white/15 hover:bg-white/30"
              }`}
              aria-label={panel.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function OrdersPanel({ data }: { data: AdminDashboardData }) {
  if (data.recentOrders.length === 0) {
    return <EmptyPanel text="Henüz sipariş yok." href="/admin/orders" linkLabel="Siparişlere git" />;
  }

  return (
    <PanelFrame title="Son siparişler" href="/admin/orders">
      <ul className="space-y-2">
        {data.recentOrders.map((order, index) => (
          <li
            key={order.id}
            className="admin-list-row"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-white">#{order.ref}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${orderStatusColors[order.status]}`}
                >
                  {orderStatusLabels[order.status]}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-zinc-500">{order.customerName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-amber-200">{formatPrice(order.total)}</p>
              <p className="text-[10px] text-zinc-600">
                {new Date(order.createdAt).toLocaleString("tr-TR")}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </PanelFrame>
  );
}

function InboxPanel({ data }: { data: AdminDashboardData }) {
  if (data.recentInbox.length === 0) {
    return <EmptyPanel text="Gelen e-posta yok." href="/admin/emails" linkLabel="E-postalara git" />;
  }

  return (
    <PanelFrame title="Son gelen e-postalar" href="/admin/emails">
      <ul className="space-y-2">
        {data.recentInbox.map((email, index) => (
          <li
            key={email.id}
            className="admin-list-row"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {!email.read && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                )}
                <p className="truncate text-sm font-medium text-white">{email.from}</p>
              </div>
              <p className="mt-0.5 truncate text-sm text-zinc-500">{email.subject}</p>
            </div>
            <p className="shrink-0 text-[10px] text-zinc-600">
              {new Date(email.receivedAt).toLocaleString("tr-TR")}
            </p>
          </li>
        ))}
      </ul>
    </PanelFrame>
  );
}

function ProductsPanel({ data }: { data: AdminDashboardData }) {
  return (
    <PanelFrame title="Ürün özeti" href="/admin/products">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Toplam", value: data.stats.productsTotal, tone: "text-white" },
          { label: "Yayında", value: data.stats.productsLive, tone: "text-emerald-300" },
          { label: "Taslak", value: data.stats.productsDraft, tone: "text-amber-300" },
        ].map((item, index) => (
          <div
            key={item.label}
            className="admin-mini-card"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <p className="text-xs text-zinc-500">{item.label}</p>
            <p className={`mt-2 text-3xl font-semibold ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-zinc-500">
        Poster görselleri, fiyatlar ve yayın durumunu ürünler sayfasından yönetin.
      </p>
      <Link
        href="/admin/products/new"
        className="mt-4 inline-flex rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-300/15"
      >
        Yeni poster ekle
      </Link>
    </PanelFrame>
  );
}

function ReviewsPanel({ data }: { data: AdminDashboardData }) {
  if (data.recentReviews.length === 0) {
    return <EmptyPanel text="Henüz yorum yok." href="/admin/reviews" linkLabel="Yorumlara git" />;
  }

  return (
    <PanelFrame title="Son yorumlar" href="/admin/reviews">
      <ul className="space-y-2">
        {data.recentReviews.map((review, index) => (
          <li
            key={review.id}
            className="admin-list-row"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-white">{review.authorName}</span>
                <span className="text-xs text-amber-300">{"★".repeat(review.rating)}</span>
                {!review.published && (
                  <span className="rounded-full bg-amber-300/10 px-2 py-0.5 text-[10px] text-amber-200">
                    Onay bekliyor
                  </span>
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">{review.body}</p>
            </div>
            <p className="shrink-0 text-[10px] text-zinc-600">
              {new Date(review.createdAt).toLocaleDateString("tr-TR")}
            </p>
          </li>
        ))}
      </ul>
    </PanelFrame>
  );
}

function SystemPanel({ data }: { data: AdminDashboardData }) {
  const items = [
    {
      label: "PayTR",
      ok: data.system.paytr,
      detail: data.system.paytr
        ? data.system.testMode
          ? "Bağlı · test modu"
          : "Bağlı · canlı mod"
        : "Yapılandırma eksik",
    },
    {
      label: "E-posta (Resend)",
      ok: data.system.email,
      detail: data.system.email ? "Gönderim aktif" : "API anahtarı eksik",
    },
    {
      label: "Depolama",
      ok: data.system.storage,
      detail: data.system.storage ? "Kalıcı depo bağlı" : "Blob bağlantısı gerekli",
    },
  ];

  return (
    <PanelFrame title="Sistem durumu" href="/admin/payments">
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={item.label}
            className="admin-mini-card"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${item.ok ? "bg-emerald-400 admin-pulse-dot" : "bg-red-400"}`}
              />
              <p className="text-sm font-medium text-white">{item.label}</p>
            </div>
            <p className="mt-2 text-xs text-zinc-500">{item.detail}</p>
          </div>
        ))}
      </div>

      {data.recentCallbacks.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
            Son PayTR bildirimleri
          </p>
          <ul className="space-y-2">
            {data.recentCallbacks.map((callback, index) => (
              <li
                key={callback.id}
                className="admin-list-row"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <span className="text-sm text-zinc-300">{callback.status}</span>
                <span className="text-sm text-amber-200">
                  {(Number(callback.totalAmount) / 100).toLocaleString("tr-TR")} ₺
                </span>
                <span className="text-[10px] text-zinc-600">
                  {new Date(callback.receivedAt).toLocaleString("tr-TR")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PanelFrame>
  );
}

function PanelFrame({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <Link href={href} className="text-xs text-amber-300/80 hover:text-amber-200">
          Tümünü gör →
        </Link>
      </div>
      {children}
    </div>
  );
}

function EmptyPanel({
  text,
  href,
  linkLabel,
}: {
  text: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
      <p className="text-sm text-zinc-500">{text}</p>
      <Link href={href} className="mt-3 text-sm text-amber-300 hover:text-amber-200">
        {linkLabel}
      </Link>
    </div>
  );
}

function QuickLink({
  href,
  children,
  accent,
}: {
  href: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        accent
          ? "border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15"
          : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
