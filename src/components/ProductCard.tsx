"use client";

import Image from "next/image";
import Link from "next/link";
import { useInView } from "@/hooks/useInView";
import { formatPrice } from "@/lib/format";
import { withImageVersion } from "@/lib/image-version";
import type { Product } from "@/lib/types";

type ProductCardProps = {
  product: Product;
  animatedPreview?: boolean;
};

export function ProductCard({ product, animatedPreview = false }: ProductCardProps) {
  const { ref, inView } = useInView<HTMLAnchorElement>();
  const isAnimated = animatedPreview && inView;

  const previewImages = (product.views.length > 0 ? product.views : [product.thumbnail])
    .map((src) => withImageVersion(src, product.updatedAt))
    .slice(0, 3);
  const previewViewCount = Math.min(previewImages.length, 3);

  return (
    <Link
      ref={ref}
      href={`/product/${product.slug}`}
      className={`product-card group block overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.02] transition-colors duration-200 hover:border-amber-200/30 hover:bg-white/[0.04] ${
        isAnimated ? "product-card--animated" : ""
      }`}
    >
      <div
        className={`relative aspect-[3/4] overflow-hidden bg-zinc-950 ${
          animatedPreview ? "product-card-stage" : ""
        }`}
      >
        <div
          className={`product-lenticular-preview relative ${
            animatedPreview ? "product-lenticular-preview--slab" : "h-full w-full"
          }`}
          data-view-count={previewViewCount}
        >
          <div className="product-lenticular-face">
            {previewImages.map((src, index) => (
              <Image
                key={`${src}-${index}`}
                src={src}
                alt={index === 0 ? product.name : ""}
                aria-hidden={index === 0 ? undefined : true}
                fill
                loading={animatedPreview && inView ? "eager" : "lazy"}
                className="product-lenticular-preview__image object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 280px"
                quality={74}
              />
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur">
          {product.viewCount} açı
        </span>
      </div>

      <div className="flex items-end justify-between gap-3 px-3 py-3 sm:px-4 sm:py-3.5">
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-white group-hover:text-amber-50 sm:text-[15px]">
          {product.name}
        </h3>
        <p className="shrink-0 text-sm font-bold tabular-nums text-amber-300 sm:text-base">
          {formatPrice(product.basePrice)}
        </p>
      </div>
    </Link>
  );
}
