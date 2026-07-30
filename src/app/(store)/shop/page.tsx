import { ShopProductGrid } from "@/components/ShopProductGrid";
import { buildMetadata } from "@/lib/seo";
import { getPublishedProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Lentiküler Poster Mağazası | 3D Koleksiyon — The Posterist",
  description:
    "Anime, sanat ve özel tasarım 3D lentiküler posterler. Açıya göre değişen premium A3 baskılar; 3 al 2 öde ve korumalı kargo.",
  path: "/shop",
  keywords: ["lentiküler poster mağazası", "poster satın al", "3d poster koleksiyon"],
});

export default async function ShopPage() {
  const products = await getPublishedProducts();

  return (
    <main className="bg-[#09090a] px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-amber-300 uppercase">
            Koleksiyon
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Mağaza
          </h1>
        </div>

        <ShopProductGrid products={products} />
      </div>
    </main>
  );
}
