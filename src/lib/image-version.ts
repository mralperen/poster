import type { Product } from "@/lib/types";

/** /uploads veya Blob CDN — Next Image optimizer ekstra sunucu çekimi yapmasın */
export function isUploadImageSrc(src: string): boolean {
  return (
    src.startsWith("/uploads/") ||
    src.includes(".public.blob.vercel-storage.com") ||
    src.includes(".blob.vercel-storage.com")
  );
}

export function withImageVersion(src: string, version?: string): string {
  if (!version || !src.startsWith("/uploads/")) return src;
  if (src.includes("v=")) return src;
  return `${src}${src.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}`;
}

export function withProductImageVersion(product: Product): Product {
  return {
    ...product,
    views: product.views.map((src) => withImageVersion(src, product.updatedAt)),
    thumbnail: withImageVersion(product.thumbnail, product.updatedAt),
    video: product.video
      ? withImageVersion(product.video, product.updatedAt)
      : undefined,
  };
}
