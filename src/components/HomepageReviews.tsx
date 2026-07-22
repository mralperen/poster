import Image from "next/image";
import Link from "next/link";
import type { HomepageReviewCard } from "@/lib/homepage-reviews";
import { isUploadImageSrc, withImageVersion } from "@/lib/image-version";

type HomepageReviewsProps = {
  reviews: HomepageReviewCard[];
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-px text-[11px] text-amber-300" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < rating ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: HomepageReviewCard }) {
  return (
    <article className="flex gap-3 rounded-[8px] border border-white/10 bg-white/[0.02] p-3 transition-colors hover:border-white/20 hover:bg-white/[0.04]">
      {review.productThumbnail ? (
        <div className="relative h-[72px] w-14 shrink-0 overflow-hidden rounded-[6px] border border-white/10 bg-zinc-950">
          <Image
            src={withImageVersion(review.productThumbnail, review.productUpdatedAt)}
            alt={review.productName ?? ""}
            fill
            sizes="56px"
            className="object-cover"
            unoptimized={isUploadImageSrc(review.productThumbnail)}
          />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <StarRow rating={review.rating} />
        <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-zinc-300">
          {review.body}
        </p>
        <p className="mt-2 truncate text-[11px] text-zinc-500">
          <span className="font-medium text-zinc-400">{review.authorName}</span>
          {review.productName ? (
            <>
              <span className="mx-1 text-zinc-700">·</span>
              <span>{review.productName}</span>
            </>
          ) : null}
        </p>
      </div>
    </article>
  );
}

export function HomepageReviews({ reviews }: HomepageReviewsProps) {
  if (reviews.length === 0) return null;

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-medium tracking-[0.24em] text-amber-300 uppercase">
          Müşteriler ne diyor?
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) =>
            review.productSlug ? (
              <Link
                key={review.id}
                href={`/product/${review.productSlug}`}
                className="block"
              >
                <ReviewCard review={review} />
              </Link>
            ) : (
              <div key={review.id}>
                <ReviewCard review={review} />
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
