import { ReviewModeration } from "@/components/admin/ReviewModeration";
import { listAllReviews } from "@/lib/db/reviews-store";
import { getProducts } from "@/lib/db/products-store";

export default async function AdminReviewsPage() {
  const [reviews, products] = await Promise.all([listAllReviews(), getProducts()]);

  const productNames = Object.fromEntries(
    products.map((product) => [product.id, product.name]),
  );

  return <ReviewModeration initialReviews={reviews} productNames={productNames} />;
}
