import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  deletePath,
  fileExists,
  readTextFile,
  writeBinaryFile,
  writeTextFile,
} from "@/lib/db/storage";
import type { PosterSize, Product } from "@/lib/types";

const DATA_FILE = "data/products.json";

export type ProductInput = {
  name: string;
  slug: string;
  description: string;
  category: string;
  badge?: string;
  viewCount: 2 | 3;
  viewLabels: string[];
  basePrice: number;
  sizePrices: Record<PosterSize, number>;
  featured?: boolean;
  published?: boolean;
};

async function readBundledProducts(): Promise<Product[]> {
  try {
    const raw = await readFile(path.join(process.cwd(), DATA_FILE), "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch {
    return [];
  }
}

async function readAll(): Promise<Product[]> {
  const raw = await readTextFile(DATA_FILE);
  if (!raw) return readBundledProducts();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return readBundledProducts();
    if (parsed.length === 0) {
      const bundled = await readBundledProducts();
      return bundled.length > 0 ? bundled : [];
    }
    return parsed as Product[];
  } catch {
    return readBundledProducts();
  }
}

async function writeAll(products: Product[]): Promise<void> {
  await writeTextFile(DATA_FILE, JSON.stringify(products, null, 2));
}

function uploadRelativePath(id: string, slotIndex: number): string {
  return `uploads/${id}/view-${slotIndex}.jpg`;
}

async function viewFileExists(viewPath: string): Promise<boolean> {
  const relative = viewPath.replace(/^\//, "");
  if (relative.startsWith("uploads/")) {
    return fileExists(relative);
  }
  return fileExists(path.join("public", relative).replace(/\\/g, "/"));
}

export async function productHasAllViews(product: Product): Promise<boolean> {
  const checks = await Promise.all(
    product.views.map((v) => viewFileExists(v.split("?")[0])),
  );
  return checks.every(Boolean);
}

export async function getProducts(options?: {
  publishedOnly?: boolean;
}): Promise<Product[]> {
  const products = await readAll();
  if (!options?.publishedOnly) return products;
  return products.filter((p) => p.published !== false);
}

export async function getPublishedProducts(): Promise<Product[]> {
  const products = await readAll();
  return products.filter((product) => product.published !== false);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await readAll();
  return products.find((p) => p.slug === slug);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await readAll();
  return products.find((p) => p.id === id);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getPublishedProducts();
  return products.filter((p) => p.featured);
}

export { slugify, defaultViewLabels } from "@/lib/product-utils";

export function uploadDirForProduct(id: string): string {
  return `uploads/${id}`;
}

export function viewPathsForProduct(id: string, viewCount: 2 | 3): string[] {
  return Array.from({ length: viewCount }, (_, i) => `/uploads/${id}/view-${i}.jpg`);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const products = await readAll();

  if (products.some((p) => p.slug === input.slug)) {
    throw new Error("Bu URL slug zaten kullanılıyor.");
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const views = viewPathsForProduct(id, input.viewCount);
  const thumbnail = views[Math.floor(views.length / 2)] ?? views[0];

  const product: Product = {
    id,
    slug: input.slug,
    name: input.name,
    description: input.description,
    category: input.category,
    badge: input.badge,
    viewCount: input.viewCount,
    views,
    viewLabels: input.viewLabels,
    thumbnail,
    basePrice: input.basePrice,
    sizes: ["A3", "A2", "A1"],
    sizePrices: input.sizePrices,
    featured: input.featured ?? false,
    published: input.published ?? false,
    createdAt: now,
    updatedAt: now,
  };

  products.push(product);
  await writeAll(products);
  return product;
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<Product> {
  const products = await readAll();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Ürün bulunamadı.");

  const current = products[index];
  const nextSlug = input.slug ?? current.slug;

  if (products.some((p) => p.slug === nextSlug && p.id !== id)) {
    throw new Error("Bu URL slug zaten kullanılıyor.");
  }

  const viewCount = input.viewCount ?? current.viewCount;
  const viewLabels = input.viewLabels ?? current.viewLabels;

  let views = current.views;
  if (input.viewCount && input.viewCount !== current.viewCount) {
    views = viewPathsForProduct(id, viewCount);
  }

  const thumbnail =
    viewCount === 3 ? (views[1] ?? views[0]) : (views[0] ?? current.thumbnail);

  // Kaydetmeden hemen önce tekrar oku — video yüklemesiyle yarışmayı önler
  const latestProducts = await readAll();
  const latest = latestProducts.find((p) => p.id === id) ?? current;

  const updated: Product = {
    ...latest,
    ...input,
    slug: nextSlug,
    viewCount,
    viewLabels,
    views: input.viewCount && input.viewCount !== latest.viewCount ? views : latest.views,
    thumbnail:
      input.viewCount && input.viewCount !== latest.viewCount
        ? thumbnail
        : latest.thumbnail,
    // Medya alanlarını form kaydı asla silmesin
    video: latest.video,
    updatedAt: new Date().toISOString(),
  };

  const writeIndex = latestProducts.findIndex((p) => p.id === id);
  if (writeIndex === -1) throw new Error("Ürün bulunamadı.");
  latestProducts[writeIndex] = updated;
  await writeAll(latestProducts);
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await readAll();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) {
    throw new Error("Ürün bulunamadı.");
  }
  await writeAll(filtered);

  // Görseller Blob'da yoksa / klasör boşsa silmeyi engellemesin
  try {
    await deletePath(uploadDirForProduct(id));
  } catch {
    /* ignore missing upload assets */
  }
}

export async function saveViewImage(
  id: string,
  slotIndex: number,
  buffer: Buffer,
): Promise<string> {
  const product = await getProductById(id);
  if (!product) throw new Error("Ürün bulunamadı.");
  if (slotIndex < 0 || slotIndex >= product.viewCount) {
    throw new Error("Geçersiz görünüm slotu.");
  }

  const relativePath = uploadRelativePath(id, slotIndex);
  await writeBinaryFile(relativePath, buffer, "image/jpeg");

  const publicPath = `/uploads/${id}/view-${slotIndex}.jpg`;
  const products = await readAll();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Ürün bulunamadı.");
  const wasReady = await productHasAllViews(products[index]);
  const wasPublished = products[index].published !== false;

  const views = [...products[index].views];
  views[slotIndex] = publicPath;

  const thumbnail =
    product.viewCount === 3 ? (views[1] ?? views[0]) : (views[0] ?? product.thumbnail);

  products[index] = {
    ...products[index],
    views,
    thumbnail,
    updatedAt: new Date().toISOString(),
  };

  const allReady = await productHasAllViews(products[index]);
  products[index].published = allReady && (!wasReady || wasPublished);

  await writeAll(products);
  return publicPath;
}

export async function saveProductVideo(
  id: string,
  buffer: Buffer,
  extension: "mp4" | "webm",
): Promise<string> {
  const product = await getProductById(id);
  if (!product) throw new Error("Ürün bulunamadı.");

  const relativePath = `uploads/${id}/video.${extension}`;
  const contentType = extension === "webm" ? "video/webm" : "video/mp4";
  await writeBinaryFile(relativePath, buffer, contentType);

  const publicPath = `/uploads/${id}/video.${extension}`;
  return registerProductVideoPath(id, publicPath);
}

export async function registerProductVideoPath(
  id: string,
  publicPath: string,
): Promise<string> {
  const products = await readAll();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Ürün bulunamadı.");

  products[index] = {
    ...products[index],
    video: publicPath,
    updatedAt: new Date().toISOString(),
  };

  await writeAll(products);
  return publicPath;
}
