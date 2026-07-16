/** Marka sabitleri — logo dosyasını `public/brand/logo.svg` ile değiştirin */
export const brand = {
  name: "The Posterist",
  shortName: "The Posterist",
  tagline: "Lentiküler Poster",
  domain: "theposterist.com",
  supportEmail: "destek@theposterist.com",
  instagram: "@theposterist",
  instagramUrl: "https://instagram.com/theposterist",
  /** Kendi logonuzu koyunca bu dosyayı güncelleyin veya aynı yola yeni görsel atın */
  logoSrc: "/brand/header-logo.png",
  logoAlt: "The Posterist",
  copyright: "© 2026 The Posterist",
} as const;

export function pageTitle(suffix?: string): string {
  if (!suffix) return `${brand.name} — ${brand.tagline}`;
  return `${suffix} — ${brand.name}`;
}
