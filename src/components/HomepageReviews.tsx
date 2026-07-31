import Image from "next/image";
import Link from "next/link";
import type { HomepageReviewCard } from "@/lib/homepage-reviews";
import { isUploadImageSrc, withImageVersion } from "@/lib/image-version";

type HomepageReviewsProps = {
  reviews: HomepageReviewCard[];
  average: number;
  totalCount: number;
};

function StarRow({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "lg";
}) {
  return (
    <div
      className={`flex items-center gap-0.5 text-amber-300 ${
        size === "lg" ? "text-base" : "text-xs"
      }`}
      aria-hidden
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < rating ? "opacity-100" : "opacity-20"}>
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: HomepageReviewCard }) {
  return (
    <article className="flex h-full flex-col rounded-[10px] border border-white/10 bg-white/[0.02] p-4 transition-colors group-hover:border-white/20 group-hover:bg-white/[0.04] sm:p-5">
      <StarRow rating={review.rating} />

      <p className="mt-3 line-clamp-4 flex-1 text-sm leading-6 text-zinc-300">
        {review.body}
      </p>

      {review.images && review.images.length > 0 ? (
        <div className="mt-4 flex gap-2">
          {review.images.slice(0, 3).map((src) => (
            <div
              key={src}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[6px] border border-white/10 bg-zinc-950"
            >
              <Image
                src={src}
                alt=""
                fill
                aria-hidden
                sizes="64px"
                className="object-cover"
                unoptimized={isUploadImageSrc(src)}
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-3 border-t border-white/8 pt-4">
        {review.productThumbnail ? (
          <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-[5px] border border-white/10 bg-zinc-950">
            <Image
              src={withImageVersion(review.productThumbnail, review.productUpdatedAt)}
              alt=""
              fill
              aria-hidden
              sizes="36px"
              className="object-cover"
              unoptimized={isUploadImageSrc(review.productThumbnail)}
            />
          </div>
        ) : null}

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {review.authorName}
          </p>
          {review.productName ? (
            <p className="truncate text-xs text-zinc-500">{review.productName}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function HomepageReviews({
  reviews,
  average,
  totalCount,
}: HomepageReviewsProps) {
  if (reviews.length === 0) return null;

  const rounded = Math.round(average * 10) / 10;

  return (
    <section className="border-t border-white/10 px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-medium tracking-[0.24em] text-amber-300 uppercase">
              Müşteriler ne diyor?
            </p>

            <div className="mt-5 flex items-end gap-3">
              <span className="text-5xl font-semibold leading-none tabular-nums text-white">
                {rounded.toLocaleString("tr-TR", { minimumFractionDigits: 1 })}
              </span>
              <span className="pb-1 text-sm text-zinc-500">/ 5</span>
            </div>

            <div className="mt-3">
              <StarRow rating={Math.round(average)} size="lg" />
            </div>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {totalCount} doğrulanmış değerlendirmeye göre. Yorumlar yalnızca
              onaylandıktan sonra yayınlanır.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/35 hover:text-white"
            >
              Koleksiyona bak
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {reviews.map((review) =>
              review.productSlug ? (
                <Link
                  key={review.id}
                  href={`/product/${review.productSlug}`}
                  className="group block"
                >
                  <ReviewCard review={review} />
                </Link>
              ) : (
                <div key={review.id} className="group">
                  <ReviewCard review={review} />
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
