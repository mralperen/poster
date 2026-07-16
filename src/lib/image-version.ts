import type { Product } from "@/lib/types";

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
