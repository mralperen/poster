"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductReview } from "@/lib/db/reviews-store";

const REVIEWS_PER_PAGE = 5;

type ProductReviewsProps = {
  productId: string;
  initialReviews: ProductReview[];
};

function StarRow({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const starSize = size === "md" ? "text-base" : "text-sm";
  return (
    <div className={`flex items-center gap-0.5 ${starSize} text-white`} aria-hidden>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < rating ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </div>
  );
}

function formatReviewDate(value: string): string {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ReviewPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      className="mt-6 flex flex-col items-center gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between"
      aria-label="Yorum sayfaları"
    >
      <p className="text-xs text-zinc-500">
        Sayfa {page} / {totalPages}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex min-h-9 items-center rounded-[8px] border border-white/10 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-white/25 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Önceki
        </button>

        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            aria-current={pageNumber === page ? "page" : undefined}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-[8px] border px-2 text-xs font-medium transition-colors ${
              pageNumber === page
                ? "border-white/30 bg-white text-black"
                : "border-white/10 text-zinc-300 hover:border-white/25 hover:bg-white/[0.04]"
            }`}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex min-h-9 items-center rounded-[8px] border border-white/10 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-white/25 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sonraki
        </button>
      </div>
    </nav>
  );
}

export function ProductReviews({ productId, initialReviews }: ProductReviewsProps) {
  const reviews = initialReviews;
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  const totalPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visibleReviews = useMemo(() => {
    const start = (page - 1) * REVIEWS_PER_PAGE;
    return reviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [reviews, page]);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    document.getElementById("product-reviews-list")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          rating,
          text,
          website: "",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Yorum gönderilemedi.");
      }

      setAuthorName("");
      setRating(5);
      setText("");
      setShowForm(false);
      setSuccess(
        "Yorumunuz alındı. Onaylandıktan sonra bu sayfada görünecek. Teşekkürler!",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-t border-white/10 pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Yorumlar
          </h2>
          {reviews.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StarRow rating={Math.round(average)} size="md" />
              <p className="text-sm text-zinc-400">
                {reviews.length} değerlendirmeye göre
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              Bu ürün için henüz yorum yok. İlk yorumu siz yazın.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((value) => !value);
            setError("");
            setSuccess("");
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-[8px] border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-white/[0.04]"
        >
          <span aria-hidden>💬</span>
          Yorum Yap
        </button>
      </div>

      {success && (
        <p className="mt-4 rounded-[8px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-[8px] border border-white/10 bg-white/[0.025] p-4 sm:p-5"
        >
          <h3 className="text-sm font-semibold text-white">Yorum yaz</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Deneyiminizi bu poster hakkında paylaşın.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                Ad Soyad
              </span>
              <input
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                required
                maxLength={60}
                className="mt-1.5 w-full rounded-[8px] border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-200/40"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                Puan
              </span>
              <div className="mt-2 flex gap-1">
                {Array.from({ length: 5 }, (_, index) => {
                  const value = index + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`flex h-10 w-10 items-center justify-center rounded-[8px] border text-lg transition-colors ${
                        value <= rating
                          ? "border-amber-300/40 bg-amber-300/15 text-amber-200"
                          : "border-white/10 text-zinc-600 hover:text-zinc-300"
                      }`}
                      aria-label={`${value} yıldız`}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
            </label>

            <label className="block sm:col-span-2">
              <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                Yorumunuz
              </span>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                className="mt-1.5 w-full resize-y rounded-[8px] border border-white/10 bg-black/30 px-4 py-2.5 text-sm leading-6 text-white outline-none focus:border-amber-200/40"
              />
            </label>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-[8px] bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-100 disabled:opacity-50"
            >
              {submitting ? "Gönderiliyor…" : "Yorumu Gönder"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-[8px] border border-white/10 px-5 py-2.5 text-sm text-zinc-300"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      <div id="product-reviews-list" className="mt-8 space-y-4">
        {visibleReviews.map((review) => (
          <article
            key={review.id}
            className="rounded-[8px] border border-white/10 bg-white/[0.02] p-4 sm:p-5"
          >
            <StarRow rating={review.rating} />
            <p className="mt-2 text-xs text-zinc-500">
              {formatReviewDate(review.createdAt)}
            </p>
            <p className="mt-3 text-sm font-medium text-zinc-300">{review.authorName}</p>
            <p className="mt-2 text-sm leading-7 text-zinc-400">{review.body}</p>
          </article>
        ))}
      </div>

      <ReviewPagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </section>
  );
}
