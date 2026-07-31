import type { ProductReview } from "@/lib/db/reviews-store";
import type { Product } from "@/lib/types";

export type HomepageReviewCard = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  meta: string;
  images?: string[];
  productSlug?: string;
  productName?: string;
  productThumbnail?: string;
  productUpdatedAt?: string;
};

/** "Duvarda nasıl görünüyor?" galerisi için müşteri karesi. */
export type CustomerPhoto = {
  id: string;
  src: string;
  authorName: string;
  productSlug?: string;
  productName?: string;
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
    ...(review.images?.length ? { images: review.images } : {}),
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

  // Ürün başına bir yorum seçmek az ürünlü mağazada bölümü yarım bırakıyor;
  // kontenjan dolmadıysa kalan yorumlarla tamamla.
  if (cards.length < limit) {
    const used = new Set(cards.map((card) => card.id));

    for (const review of input.reviews) {
      if (cards.length >= limit) break;
      if (!review.published || used.has(review.id)) continue;

      const card = toProductCard(review, productsById);
      if (!card) continue;

      used.add(card.id);
      cards.push(card);
    }
  }

  return cards.slice(0, limit);
}

/**
 * Yayınlanmış yorumlardaki müşteri fotoğraflarını en yeniden başlayarak toplar.
 * Henüz fotoğraflı yorum yoksa boş döner — galeri bölümü kendini gizler.
 */
export function buildCustomerPhotos(input: {
  reviews: ProductReview[];
  products: Product[];
  limit?: number;
}): CustomerPhoto[] {
  const limit = input.limit ?? 8;
  const productsById = new Map(input.products.map((product) => [product.id, product]));
  const photos: CustomerPhoto[] = [];

  for (const review of input.reviews) {
    if (!review.published || !review.images?.length) continue;

    const product = productsById.get(review.productId);
    if (product && !product.published) continue;

    for (const src of review.images) {
      photos.push({
        id: `${review.id}-${src}`,
        src,
        authorName: review.authorName,
        productSlug: product?.slug,
        productName: product?.name,
      });

      if (photos.length >= limit) return photos;
    }
  }

  return photos;
}
