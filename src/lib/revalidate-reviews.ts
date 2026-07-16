import { revalidatePath } from "next/cache";
import { getProductById } from "@/lib/db/products-store";

export async function revalidateReviewPaths(productId: string): Promise<void> {
  revalidatePath("/");
  revalidatePath("/shop");

  const product = await getProductById(productId);
  if (product?.slug) {
    revalidatePath(`/product/${product.slug}`);
  }
}
