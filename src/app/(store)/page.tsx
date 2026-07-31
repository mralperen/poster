import Link from "next/link";
import { CustomerWall } from "@/components/CustomerWall";
import { HomepageReviews } from "@/components/HomepageReviews";
import { LenticularHero } from "@/components/LenticularHero";
import { ProductCard } from "@/components/ProductCard";
import { TrustStrip } from "@/components/TrustStrip";
import { listPublishedReviews } from "@/lib/db/reviews-store";
import {
  buildCustomerPhotos,
  buildHomepageReviews,
  summarizeHomepageReviews,
} from "@/lib/homepage-reviews";
import { getFeaturedProducts, getPublishedProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, products, publishedReviews] = await Promise.all([
    getFeaturedProducts(),
    getPublishedProducts(),
    listPublishedReviews(),
  ]);

  // Hero vitrinde çok ürün şeridi bozar; en fazla 5 öne çıkan göster.
  const showcaseProducts = (
    featured.length > 0 ? featured : products.slice(0, 5)
  ).slice(0, 5);
  const homepageReviews = buildHomepageReviews({
    reviews: publishedReviews,
    products,
    limit: 4,
  });
  const customerPhotos = buildCustomerPhotos({
    reviews: publishedReviews,
    products,
    limit: 8,
  });
  const reviewSummary = summarizeHomepageReviews({
    reviews: publishedReviews,
    products,
  });

  return (
    <main className="bg-[#09090a] text-white">
      <LenticularHero
        products={showcaseProducts}
        rating={reviewSummary.average}
        ratingCount={reviewSummary.count}
      />

      <section className="border-t border-white/[0.06] px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.24em] text-amber-300 uppercase">
                Koleksiyon
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Öne çıkan posterler
              </h2>
            </div>
            <Link
              href="/shop"
              className="w-fit rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/35 hover:text-white"
            >
              Tüm koleksiyon
            </Link>
          </div>

          {/* 5. kart 4'lü ızgarada tek başına alta düşüyor; ızgarada 4 göster. */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {showcaseProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} animatedPreview />
            ))}
          </div>
        </div>
      </section>

      <HomepageReviews
        reviews={homepageReviews}
        average={reviewSummary.average}
        totalCount={reviewSummary.count}
      />
      <CustomerWall photos={customerPhotos} />
      <TrustStrip />
    </main>
  );
}
