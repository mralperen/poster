"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";

const NAV_ICON_CLASS = "h-[18px] w-[18px] shrink-0 sm:h-4 sm:w-4";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  isActive: (pathname: string) => boolean;
};

function IconPanel() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={NAV_ICON_CLASS}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconProducts() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={NAV_ICON_CLASS}>
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 8h14" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="6" r="0.75" fill="currentColor" />
      <circle cx="10" cy="6" r="0.75" fill="currentColor" />
    </svg>
  );
}

function IconOrders() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={NAV_ICON_CLASS}>
      <path
        d="M4 5.5h12l-1.2 8.5H5.2L4 5.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7 5.5V4.5a3 3 0 0 1 6 0v1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={NAV_ICON_CLASS}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m3.5 6 6.5 4.5L16.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconReviews() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={NAV_ICON_CLASS}>
      <path
        d="M4 5.5h12v8H6.8L4 15.8V5.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7.5 9h5M7.5 11.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconPayment() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={NAV_ICON_CLASS}>
      <rect x="2.5" y="5" width="15" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 8.5h15" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconContent() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={NAV_ICON_CLASS}>
      <path
        d="M5.5 4.5h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M7 8h6M7 10.5h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconSecurity() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={NAV_ICON_CLASS}>
      <path
        d="M10 3.5 15 5.5v4.8c0 3.2-2.1 5.4-5 6.2-2.9-.8-5-3-5-6.2V5.5l5-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="m8.2 10 1.3 1.3 2.8-2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={NAV_ICON_CLASS}>
      <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconStore() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="h-4 w-4 shrink-0">
      <path
        d="M4 8.5 10 3.5l6 5v7.5H4V8.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 11h4v5H8v-5Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="h-4 w-4 shrink-0">
      <path d="M8 4.5H5.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11.5 10H17M17 10l-2-2M17 10l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const navItems: NavItem[] = [
  {
    href: "/admin",
    label: "Panel",
    shortLabel: "Panel",
    icon: <IconPanel />,
    isActive: (pathname) => pathname === "/admin",
  },
  {
    href: "/admin/products",
    label: "Ürünler",
    shortLabel: "Ürün",
    icon: <IconProducts />,
    isActive: (pathname) =>
      pathname === "/admin/products" ||
      (pathname.startsWith("/admin/products/") && !pathname.endsWith("/new")),
  },
  {
    href: "/admin/orders",
    label: "Siparişler",
    shortLabel: "Sipariş",
    icon: <IconOrders />,
    isActive: (pathname) => pathname.startsWith("/admin/orders"),
  },
  {
    href: "/admin/emails",
    label: "E-posta",
    shortLabel: "E-posta",
    icon: <IconMail />,
    isActive: (pathname) =>
      pathname.startsWith("/admin/emails") || pathname.startsWith("/admin/inbox"),
  },
  {
    href: "/admin/reviews",
    label: "Yorumlar",
    shortLabel: "Yorum",
    icon: <IconReviews />,
    isActive: (pathname) => pathname.startsWith("/admin/reviews"),
  },
  {
    href: "/admin/payments",
    label: "Ödeme",
    shortLabel: "Ödeme",
    icon: <IconPayment />,
    isActive: (pathname) => pathname.startsWith("/admin/payments"),
  },
  {
    href: "/admin/content",
    label: "İçerik",
    shortLabel: "İçerik",
    icon: <IconContent />,
    isActive: (pathname) => pathname.startsWith("/admin/content"),
  },
  {
    href: "/admin/security",
    label: "Güvenlik",
    shortLabel: "Güvenlik",
    icon: <IconSecurity />,
    isActive: (pathname) => pathname.startsWith("/admin/security"),
  },
];

function navLinkClass(active: boolean, accent = false): string {
  const layout =
    "flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 sm:min-h-0 sm:w-auto sm:flex-row sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:py-1.5";

  if (accent) {
    return `${layout} border border-amber-300/25 bg-amber-300/10 text-amber-100 transition-colors hover:bg-amber-300/15 sm:rounded-full sm:px-3`;
  }

  return `${layout} text-xs font-medium transition-colors ${
    active
      ? "bg-white/10 text-white"
      : "text-zinc-400 hover:bg-white/5 hover:text-white"
  }`;
}

export function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="border-b border-white/5 bg-[#0a0a0c]">
      <div className="mx-auto max-w-6xl px-3 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <BrandLogo href="/admin" showTagline={false} size="sm" />

          <div className="flex items-center gap-1 sm:gap-2">
            <AdminNotificationBell />
            <Link
              href="/"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 sm:h-auto sm:w-auto sm:gap-1.5 sm:rounded-lg sm:px-2 sm:py-1.5"
              title="Mağazayı gör"
              aria-label="Mağazayı gör"
            >
              <IconStore />
              <span className="hidden md:inline text-xs">Mağaza</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-white/5 hover:text-red-400 sm:h-auto sm:w-auto sm:gap-1.5 sm:rounded-lg sm:px-2 sm:py-1.5"
              title="Çıkış"
              aria-label="Çıkış"
            >
              <IconLogout />
              <span className="hidden md:inline text-xs">Çıkış</span>
            </button>
          </div>
        </div>

        <nav
          className="mt-3 grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-1 lg:flex-nowrap"
          aria-label="Admin menüsü"
        >
          {navItems.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(active)}
                title={item.label}
                aria-label={item.label}
              >
                {item.icon}
                <span className="max-w-full truncate text-[10px] leading-tight sm:hidden">
                  {item.shortLabel}
                </span>
                <span className="hidden whitespace-nowrap sm:inline">{item.label}</span>
              </Link>
            );
          })}

          <span className="mx-1 hidden h-5 w-px shrink-0 bg-white/10 sm:block" aria-hidden />

          <Link
            href="/admin/products/new"
            className={`${navLinkClass(pathname.endsWith("/new"), true)} sm:shrink-0`}
            title="Yeni poster"
            aria-label="Yeni poster"
          >
            <IconPlus />
            <span className="text-[10px] leading-tight sm:hidden">Yeni</span>
            <span className="hidden whitespace-nowrap sm:inline">Yeni</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
