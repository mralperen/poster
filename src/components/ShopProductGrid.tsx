import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

type ShopProductGridProps = {
  products: Product[];
};

export function ShopProductGrid({ products }: ShopProductGridProps) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} animatedPreview />
        ))}
    </div>
  );
}
