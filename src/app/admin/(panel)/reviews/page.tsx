import { ReviewModeration } from "@/components/admin/ReviewModeration";
import { listAllReviews } from "@/lib/db/reviews-store";
import { getProducts } from "@/lib/db/products-store";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const [reviews, products] = await Promise.all([listAllReviews(), getProducts()]);

  const productNames = Object.fromEntries(
    products.map((product) => [product.id, product.name]),
  );

  const listKey = reviews
    .map((review) => `${review.id}:${review.published ? 1 : 0}`)
    .join("|");

  return (
    <ReviewModeration
      key={listKey}
      initialReviews={reviews}
      productNames={productNames}
    />
  );
}
