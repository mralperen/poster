import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!url || url.includes("localhost") || url.includes("example.com")) {
    return "https://theposterist.com";
  }
  return url.replace(/\/$/, "");
}

export const defaultKeywords = [
  "lentiküler poster",
  "3d poster",
  "lenticular poster",
  "the posterist",
  "duvar posteri",
  "anime poster",
  "lentiküler tablo",
  "açı değiştiren poster",
  "özel poster",
  "poster mağazası",
  "lentiküler duvar sanatı",
  "hediyelik poster",
];

export const defaultDescription =
  "The Posterist — Türkiye'nin 3D lentiküler poster mağazası. Açıya göre değişen premium A3 posterler; anime, sanat ve özel koleksiyonlar. Güvenli ödeme, korumalı kargo.";

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

const OG_IMAGE_PATH = "/og-image.jpg";

type BuildMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
  ogImage?: string;
};

export function buildMetadata(input: BuildMetadataInput = {}): Metadata {
  const title =
    input.title ??
    `${brand.name} | Lentiküler Poster — Açıya Göre Değişen 3D Duvar Sanatı`;
  const description = input.description ?? defaultDescription;
  const canonical = absoluteUrl(input.path ?? "/");
  const ogImage = absoluteUrl(input.ogImage ?? OG_IMAGE_PATH);

  return {
    title,
    description,
    keywords: input.keywords ?? defaultKeywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: canonical,
      siteName: brand.name,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${brand.name} — ${brand.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
    },
    manifest: "/site.webmanifest",
    category: "shopping",
  };
}

export function productKeywords(productName: string): string[] {
  return [
    productName,
    `${productName} lentiküler poster`,
    "lentiküler poster satın al",
    ...defaultKeywords,
  ];
}
