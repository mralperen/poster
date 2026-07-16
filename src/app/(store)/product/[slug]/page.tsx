import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/AddToCartForm";
import { PosterScrubber } from "@/components/PosterScrubber";
import { listProductReviews } from "@/lib/db/reviews-store";
import { ProductDescriptionPanel } from "@/components/ProductDescriptionPanel";
import { ProductReviews } from "@/components/ProductReviews";
import { ProductMobileBar } from "@/components/ProductMobileBar";
import { ProductVideoButton } from "@/components/ProductVideoButton";
import { brand } from "@/lib/brand";
import { withProductImageVersion } from "@/lib/image-version";
import { getProductBySlug, getPublishedProducts } from "@/lib/products";
import { STANDARD_POSTER_SIZE_LABEL } from "@/lib/pricing";
import { absoluteUrl, buildMetadata, productKeywords } from "@/lib/seo";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Ürün bulunamadı" };

  const description = `${product.description} ${STANDARD_POSTER_SIZE_LABEL} lentiküler poster. Güvenli ödeme ve korumalı kargo ile The Posterist'ten sipariş verin.`;

  return buildMetadata({
    title: `${product.name} | Lentiküler Poster — ${brand.name}`,
    description,
    path: `/product/${product.slug}`,
    keywords: productKeywords(product.name),
    ogImage: absoluteUrl(product.thumbnail),
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.published === false) notFound();
  const displayProduct = withProductImageVersion(product);

  const [allProducts, siteContent, productReviews] = await Promise.all([
    getPublishedProducts(),
    getSiteContent(),
    listProductReviews(product.id),
  ]);

  const bundleOptions = allProducts
    .filter((candidate) => candidate.id !== product.id)
    .sort((a, b) => {
      const aSameCategory = a.category === product.category ? 0 : 1;
      const bSameCategory = b.category === product.category ? 0 : 1;
      if (aSameCategory !== bSameCategory) return aSameCategory - bSameCategory;
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    })
    .map(withProductImageVersion);

  const pricing = {
    shippingFee: siteContent.general.shippingFee,
    freeShippingThreshold: siteContent.general.freeShippingThreshold,
    bundleSecondPercent: siteContent.general.bundleSecondPercent,
    bundleThirdPercent: siteContent.general.bundleThirdPercent,
  };

  return (
    <>
      <main className="overflow-x-hidden bg-[#09090a] px-4 py-6 pb-28 text-white sm:px-6 sm:py-10 lg:py-14 lg:pb-16">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/shop"
            className="inline-flex min-h-11 items-center text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            ← Mağazaya dön
          </Link>

          <div className="mt-5 grid min-w-0 gap-8 lg:mt-8 lg:grid-cols-2 lg:items-start lg:gap-12">
            <div data-product-gallery className="min-w-0 flex gap-3 sm:gap-4">
              <div
                data-product-thumbnails
                className="flex w-[68px] shrink-0 flex-col gap-2 sm:w-20"
              >
                {displayProduct.views.map((src, index) => (
                  <div
                    data-product-thumb
                    key={`${src}-${index}`}
                    className="relative aspect-[3/4] overflow-hidden rounded-[6px] border border-white/10 bg-zinc-950"
                  >
                    <Image
                      src={src}
                      alt={displayProduct.viewLabels[index]}
                      width={160}
                      height={213}
                      loading="lazy"
                      className="h-full w-full object-cover"
                      sizes="80px"
                    />
                  </div>
                ))}
              </div>

              <div className="min-w-0 flex-1">
                <PosterScrubber
                  views={displayProduct.views}
                  viewLabels={displayProduct.viewLabels}
                  alt={displayProduct.name}
                  priority
                />
              </div>
            </div>

            <div id="purchase" className="min-w-0 lg:sticky lg:top-24">
              <div className="flex min-w-0 items-center gap-3">
                <h1 className="min-w-0 flex-1 truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  {product.name}
                </h1>
                <ProductVideoButton src={displayProduct.video} title={product.name} />
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                {STANDARD_POSTER_SIZE_LABEL} · Korumalı kargo
              </p>

              <div
                data-purchase-card
                className="mt-6 rounded-[8px] border border-white/10 bg-white/[0.025] p-4 sm:p-5"
              >
                <AddToCartForm
                  product={displayProduct}
                  relatedProducts={bundleOptions}
                  pricing={pricing}
                />
              </div>
            </div>
          </div>

          <div className="mt-10 lg:mt-12">
            <ProductDescriptionPanel
              name={product.name}
              description={product.description}
              viewCount={product.viewCount}
              sizeLabel={STANDARD_POSTER_SIZE_LABEL}
            />
          </div>

          <ProductReviews
            productId={product.id}
            initialReviews={productReviews}
          />
        </div>
      </main>

      <ProductMobileBar product={displayProduct} />
    </>
  );
}
