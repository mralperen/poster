import Link from "next/link";
import { HomepageReviews } from "@/components/HomepageReviews";
import { LenticularHero } from "@/components/LenticularHero";
import { ProductCard } from "@/components/ProductCard";
import { TrustStrip } from "@/components/TrustStrip";
import { listPublishedReviews } from "@/lib/db/reviews-store";
import { buildHomepageReviews } from "@/lib/homepage-reviews";
import { getFeaturedProducts, getPublishedProducts } from "@/lib/products";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, products, content, publishedReviews] = await Promise.all([
    getFeaturedProducts(),
    getPublishedProducts(),
    getSiteContent(),
    listPublishedReviews(),
  ]);

  const showcaseProducts = featured.length > 0 ? featured : products.slice(0, 3);
  const homepageReviews = buildHomepageReviews({
    reviews: publishedReviews,
    products,
    limit: 6,
  });

  return (
    <main className="bg-[#09090a] text-white">
      <LenticularHero products={showcaseProducts} />

      <section className="px-4 py-14 sm:px-6 sm:py-20">
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

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {showcaseProducts.map((product) => (
              <ProductCard key={product.id} product={product} animatedPreview />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b0b0c] px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-amber-300 uppercase">
              Lentiküler deneyim
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              {content.home.storyTitle}
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {content.home.guideItems.map((item, index) => (
              <article
                key={item.title}
                className="rounded-[8px] border border-white/10 bg-white/[0.025] px-4 py-5"
              >
                <span className="text-xs font-semibold text-amber-300/90">
                  0{index + 1}
                </span>
                <h3 className="mt-2 text-sm font-semibold text-white">{item.title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <HomepageReviews reviews={homepageReviews} />
      <TrustStrip />
    </main>
  );
}
