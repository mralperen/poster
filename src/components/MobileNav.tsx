"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/context/CartContext";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { itemCount } = useCart();

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const menuOverlay =
    mounted && open
      ? createPortal(
          <div className="fixed inset-0 z-[999] md:hidden">
            <button
              type="button"
              aria-label="Menüyü kapat"
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <nav className="fixed inset-y-0 right-0 z-[1000] flex w-[min(86vw,340px)] flex-col border-l border-white/10 bg-[#09090a] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[-28px_0_70px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Menü</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Kapat"
                  className="flex h-10 w-10 items-center justify-center rounded-[8px] text-zinc-400"
                >
                  ×
                </button>
              </div>

              <div className="mt-8 flex flex-col gap-2">
                <MobileLink href="/" onClick={() => setOpen(false)}>
                  Ana Sayfa
                </MobileLink>
                <MobileLink href="/shop" onClick={() => setOpen(false)}>
                  Mağaza
                </MobileLink>
                <MobileLink href="/about" onClick={() => setOpen(false)}>
                  Hakkımızda
                </MobileLink>
                <MobileLink href="/shipping" onClick={() => setOpen(false)}>
                  Kargo Koşulları
                </MobileLink>
                <MobileLink href="/returns" onClick={() => setOpen(false)}>
                  İade Koşulları
                </MobileLink>
                <MobileLink href="/terms" onClick={() => setOpen(false)}>
                  Satış Sözleşmesi
                </MobileLink>
                <MobileLink href="/faq" onClick={() => setOpen(false)}>
                  S.S.S.
                </MobileLink>
                <MobileLink href="/contact" onClick={() => setOpen(false)}>
                  İletişim
                </MobileLink>
                <MobileLink href="/cart" onClick={() => setOpen(false)}>
                  Sepet {itemCount > 0 && `(${itemCount})`}
                </MobileLink>
              </div>
            </nav>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menüyü aç"
        className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-white/10 text-zinc-300"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {menuOverlay}
    </div>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-[8px] border border-white/10 bg-white/[0.03] px-4 py-3.5 text-base font-medium text-zinc-200 transition-colors active:bg-white/10"
    >
      {children}
    </Link>
  );
}
