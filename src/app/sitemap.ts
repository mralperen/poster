import type { MetadataRoute } from "next";
import { getPublishedProducts } from "@/lib/products";
import { absoluteUrl } from "@/lib/seo";

const staticPaths = [
  { path: "/", priority: 1, changeFrequency: "daily" as const },
  { path: "/shop", priority: 0.95, changeFrequency: "daily" as const },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.55, changeFrequency: "monthly" as const },
  { path: "/shipping", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/returns", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/terms", priority: 0.45, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getPublishedProducts();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((item) => ({
    url: absoluteUrl(item.path),
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/product/${product.slug}`),
    lastModified: new Date(product.updatedAt ?? product.createdAt ?? Date.now()),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticEntries, ...productEntries];
}
