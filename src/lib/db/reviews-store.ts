import { randomUUID } from "node:crypto";
import {
  rememberMediaUrl,
  readTextFile,
  writeBinaryFile,
  writeTextFile,
} from "@/lib/db/storage";
import { MAX_REVIEW_IMAGES } from "@/lib/review-constants";

export type ProductReview = {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  /** Müşterinin yüklediği fotoğraflar (/uploads/reviews/...) */
  images?: string[];
  createdAt: string;
  published: boolean;
};

export { MAX_REVIEW_IMAGES } from "@/lib/review-constants";

const DATA_FILE = "data/product-reviews.json";

async function readAll(): Promise<ProductReview[]> {
  const raw = await readTextFile(DATA_FILE);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ProductReview[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(reviews: ProductReview[]): Promise<void> {
  await writeTextFile(DATA_FILE, `${JSON.stringify(reviews, null, 2)}\n`);
}

function sortNewestFirst(reviews: ProductReview[]): ProductReview[] {
  return [...reviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function listProductReviews(productId: string): Promise<ProductReview[]> {
  const reviews = await readAll();
  return sortNewestFirst(
    reviews.filter((review) => review.productId === productId && review.published),
  );
}

export async function listPublishedReviews(): Promise<ProductReview[]> {
  const reviews = await readAll();
  return sortNewestFirst(reviews.filter((review) => review.published));
}

export async function listAllReviews(): Promise<ProductReview[]> {
  return sortNewestFirst(await readAll());
}

export async function getReviewById(id: string): Promise<ProductReview | undefined> {
  const reviews = await readAll();
  return reviews.find((review) => review.id === id);
}

export function isValidReviewImagePath(
  productId: string,
  imagePath: string,
): boolean {
  const clean = imagePath.split("?")[0] ?? "";
  const prefix = `/uploads/reviews/${productId}/`;
  if (!clean.startsWith(prefix)) return false;
  const filename = clean.slice(prefix.length);
  return /^[a-zA-Z0-9_-]+\.(?:jpe?g|png|webp)$/i.test(filename);
}

export async function saveReviewImage(
  productId: string,
  buffer: Buffer,
): Promise<string> {
  const relativePath = `uploads/reviews/${productId}/${randomUUID()}.jpg`;
  const publicUrl = await writeBinaryFile(relativePath, buffer, "image/jpeg");
  if (typeof publicUrl === "string" && publicUrl) {
    rememberMediaUrl(relativePath, publicUrl);
  }
  return `/${relativePath}`;
}

export async function createProductReview(input: {
  productId: string;
  authorName: string;
  rating: number;
  body: string;
  images?: string[];
}): Promise<ProductReview> {
  const reviews = await readAll();
  const images = (input.images ?? [])
    .map((src) => src.split("?")[0] ?? "")
    .filter((src) => isValidReviewImagePath(input.productId, src))
    .slice(0, MAX_REVIEW_IMAGES);

  const review: ProductReview = {
    id: randomUUID(),
    productId: input.productId,
    authorName: input.authorName.trim(),
    rating: input.rating,
    title: "",
    body: input.body.trim(),
    ...(images.length > 0 ? { images } : {}),
    createdAt: new Date().toISOString(),
    published: false,
  };

  reviews.unshift(review);
  await writeAll(reviews);
  return review;
}

export async function setReviewPublished(
  id: string,
  published: boolean,
): Promise<ProductReview | undefined> {
  const reviews = await readAll();
  const index = reviews.findIndex((review) => review.id === id);
  if (index === -1) return undefined;

  reviews[index] = { ...reviews[index], published };
  await writeAll(reviews);
  return reviews[index];
}

export async function deleteReview(id: string): Promise<boolean> {
  const reviews = await readAll();
  const next = reviews.filter((review) => review.id !== id);
  if (next.length === reviews.length) return false;
  await writeAll(next);
  return true;
}

export function averageRating(reviews: ProductReview[]): number {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return sum / reviews.length;
}

export function countPendingReviews(reviews: ProductReview[]): number {
  return reviews.filter((review) => !review.published).length;
}
