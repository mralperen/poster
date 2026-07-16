import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { brand } from "@/lib/brand";
import { getSiteContent } from "@/lib/site-content";

const shopLinks = [
  { href: "/shop", label: "Mağaza" },
  { href: "/cart", label: "Sepet" },
  { href: "/checkout", label: "Ödeme" },
];

const supportLinks = [
  { href: "/terms", label: "Satış Sözleşmesi" },
  { href: "/shipping", label: "Kargo" },
  { href: "/returns", label: "İade" },
  { href: "/faq", label: "S.S.S." },
];

const brandLinks = [
  { href: "/about", label: "Hakkımızda" },
  { href: "/contact", label: "İletişim" },
];

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:border-amber-300/40 hover:bg-amber-300/10 hover:text-amber-200"
    >
      {children}
    </a>
  );
}

export async function Footer() {
  const { general } = await getSiteContent();

  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-[#070708]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="inline-block">
              <Image
                src={brand.logoSrc}
                alt={brand.logoAlt}
                width={200}
                height={48}
                className="h-9 w-auto"
              />
            </Link>
            <p className="mt-4 text-sm leading-6 text-zinc-500">
              Açıya göre değişen 3D lentiküler posterler. A3 sabit ölçü,
              korumalı gönderim.
            </p>

            <div className="mt-6 flex items-center gap-2.5">
              <SocialIcon href={brand.instagramUrl} label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </SocialIcon>
              <SocialIcon href={`mailto:${general.supportEmail}`} label="E-posta">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 7.5h16v9H4v-9Z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m4 8 8 5.5L20 8"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                  />
                </svg>
              </SocialIcon>
              <SocialIcon
                href={`https://wa.me/${general.supportPhone.replace(/\D/g, "")}`}
                label="WhatsApp"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.2 9.4c.2-.5.8-.7 1.2-.5.9.4 2.1 1.4 2.4 2.3.1.4 0 .8-.4 1.1l-.6.5c-.2.2-.2.5 0 .8.5.8 1.4 1.6 2.3 2 .3.2.6.1.8-.1l.4-.5c.3-.3.7-.4 1.1-.2 1 .5 2 1.2 2.7 2 .2.3.1.7-.2.9-.8.6-1.8 1-2.8 1.1-1.5.1-3.1-.4-4.5-1.4-2.1-1.5-3.5-3.8-3.7-6.2-.1-1 .2-2 .9-2.8Z"
                    fill="currentColor"
                  />
                </svg>
              </SocialIcon>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 sm:gap-12">
            <FooterColumn title="Mağaza" links={shopLinks} />
            <FooterColumn title="Destek" links={supportLinks} />
            <FooterColumn title="Marka" links={brandLinks} />
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.06] px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>{brand.copyright}</p>
          <p className="text-zinc-700">{general.supportEmail}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="text-[11px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
        {title}
      </h2>
      <nav className="mt-4 flex flex-col gap-2.5">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
