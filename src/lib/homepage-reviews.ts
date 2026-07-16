import type { ProductReview } from "@/lib/db/reviews-store";
import type { Product } from "@/lib/types";

export type HomepageReviewCard = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  meta: string;
  productSlug?: string;
  productName?: string;
  productThumbnail?: string;
  productUpdatedAt?: string;
};

function dailySeed(): number {
  const day = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < day.length; i += 1) {
    hash = (hash * 31 + day.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const next = [...items];
  let state = seed || 1;

  for (let i = next.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

function pickBestReviewPerProduct(reviews: ProductReview[]): ProductReview[] {
  const byProduct = new Map<string, ProductReview>();

  for (const review of reviews) {
    if (!review.published) continue;

    const current = byProduct.get(review.productId);
    if (!current) {
      byProduct.set(review.productId, review);
      continue;
    }

    const currentTime = new Date(current.createdAt).getTime();
    const reviewTime = new Date(review.createdAt).getTime();
    const isBetter =
      review.rating > current.rating ||
      (review.rating === current.rating && reviewTime > currentTime);

    if (isBetter) {
      byProduct.set(review.productId, review);
    }
  }

  return [...byProduct.values()];
}

function toProductCard(
  review: ProductReview,
  productsById: Map<string, Product>,
): HomepageReviewCard | null {
  const product = productsById.get(review.productId);
  if (!product?.published) return null;

  return {
    id: review.id,
    authorName: review.authorName,
    rating: review.rating,
    body: review.body,
    meta: product.name,
    productSlug: product.slug,
    productName: product.name,
    productThumbnail: product.thumbnail,
    productUpdatedAt: product.updatedAt,
  };
}

export function buildHomepageReviews(input: {
  reviews: ProductReview[];
  products: Product[];
  limit?: number;
}): HomepageReviewCard[] {
  const limit = input.limit ?? 6;
  const productsById = new Map(input.products.map((product) => [product.id, product]));

  const productReviews = pickBestReviewPerProduct(input.reviews);
  const cards = seededShuffle(productReviews, dailySeed())
    .map((review) => toProductCard(review, productsById))
    .filter((card): card is HomepageReviewCard => card !== null);

  return cards.slice(0, limit);
}
