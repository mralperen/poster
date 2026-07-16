"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProductReview } from "@/lib/db/reviews-store";

type ReviewModerationProps = {
  initialReviews: ProductReview[];
  productNames: Record<string, string>;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-sm text-amber-200" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < rating ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </div>
  );
}

export function ReviewModeration({
  initialReviews,
  productNames,
}: ReviewModerationProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<"all" | "pending" | "published">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const visibleReviews = reviews.filter((review) => {
    if (filter === "pending") return !review.published;
    if (filter === "published") return review.published;
    return true;
  });

  const pendingCount = reviews.filter((review) => !review.published).length;

  const updateReview = async (id: string, published: boolean) => {
    setLoadingId(id);
    setError("");

    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Güncellenemedi.");

      setReviews((current) =>
        current.map((review) =>
          review.id === id ? (data.review as ProductReview) : review,
        ),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoadingId(null);
    }
  };

  const removeReview = async (id: string) => {
    if (!confirm("Bu yorumu kalıcı olarak silmek istiyor musunuz?")) return;

    setLoadingId(id);
    setError("");

    try {
      const response = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Silinemedi.");

      setReviews((current) => current.filter((review) => review.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Yorumlar</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Müşteri yorumlarını onaylayın veya silin.
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-300">
                {pendingCount} onay bekliyor
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Tümü"],
              ["pending", "Onay bekleyen"],
              ["published", "Yayında"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === value
                  ? "bg-white text-black"
                  : "border border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-[8px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-3">
        {visibleReviews.length === 0 ? (
          <div className="rounded-[8px] border border-white/10 bg-white/[0.025] p-6 text-sm text-zinc-500">
            Bu filtrede yorum yok.
          </div>
        ) : (
          visibleReviews.map((review) => {
            const productName = productNames[review.productId] ?? "Bilinmeyen ürün";
            const isLoading = loadingId === review.id;

            return (
              <article
                key={review.id}
                className="rounded-[8px] border border-white/10 bg-white/[0.025] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          review.published
                            ? "bg-emerald-300/10 text-emerald-200"
                            : "bg-amber-300/10 text-amber-200"
                        }`}
                      >
                        {review.published ? "Yayında" : "Onay bekliyor"}
                      </span>
                      <StarRow rating={review.rating} />
                    </div>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">{review.body}</p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span>{review.authorName}</span>
                      <span>
                        {new Date(review.createdAt).toLocaleString("tr-TR")}
                      </span>
                      <span className="text-zinc-400">{productName}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!review.published && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => updateReview(review.id, true)}
                        className="rounded-lg bg-emerald-400/15 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/25 disabled:opacity-50"
                      >
                        Onayla
                      </button>
                    )}
                    {review.published && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => updateReview(review.id, false)}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white disabled:opacity-50"
                      >
                        Yayından kaldır
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => removeReview(review.id)}
                      className="rounded-lg border border-red-400/30 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                    >
                      Sil
                    </button>
                  </div>
                </div>

                <p className="mt-3 font-mono text-[10px] text-zinc-600">{review.id}</p>
              </article>
            );
          })
        )}
      </div>

      <p className="mt-6 text-xs text-zinc-600">
        Yeni müşteri yorumları varsayılan olarak onay bekler; onayladıktan sonra ürün
        sayfasında görünür.
      </p>
    </div>
  );
}
