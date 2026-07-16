"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CampaignBar } from "@/components/CampaignBar";
import { MobileNav } from "@/components/MobileNav";
import { useCart } from "@/context/CartContext";

type HeaderProps = {
  campaignText?: string;
};

export function Header({ campaignText }: HeaderProps) {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090a] pt-[env(safe-area-inset-top)] shadow-[0_1px_0_rgba(255,255,255,0.04)]">
      {campaignText && <CampaignBar text={campaignText} />}
      <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6 sm:py-3">
        <div className="flex items-center justify-between gap-4 md:hidden">
          <BrandLogo size="header" />
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/cart"
              aria-label={`Sepet${itemCount > 0 ? `, ${itemCount} ürün` : ""}`}
              className="relative flex h-11 w-11 items-center justify-center rounded-[8px] border border-white/10 text-zinc-300"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M5 7h10l-1.2 6H6.2L5 7Zm2-3h6l1 2H6l1-2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-300 px-1 text-[10px] font-bold text-black">
                  {itemCount}
                </span>
              )}
            </Link>
            <MobileNav />
          </div>
        </div>

        <div className="hidden grid-cols-[1fr_auto_1fr] items-center gap-3 md:grid">
          <nav className="flex items-center gap-5">
            <HeaderLink href="/shop">Mağaza</HeaderLink>
            <HeaderLink href="/about">Hakkımızda</HeaderLink>
            <HeaderLink href="/shipping">Kargo</HeaderLink>
            <HeaderLink href="/faq">S.S.S.</HeaderLink>
          </nav>

          <div className="flex justify-center justify-self-center">
            <BrandLogo size="header" />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Link
              href="/cart"
              className="relative inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
            >
              Sepet
              {itemCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-300 px-1 text-xs font-bold text-black">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-zinc-400 transition-colors hover:text-white"
    >
      {children}
    </Link>
  );
}
