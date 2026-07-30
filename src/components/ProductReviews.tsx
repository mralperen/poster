"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { ProductReview } from "@/lib/db/reviews-store";
import { MAX_REVIEW_IMAGES, MAX_REVIEW_PHOTO_BYTES } from "@/lib/review-constants";
import { isUploadImageSrc } from "@/lib/image-version";

const REVIEWS_PER_PAGE = 5;

type ProductReviewsProps = {
  productId: string;
  initialReviews: ProductReview[];
};

type PendingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
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

function ReviewPhotoLightbox({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Fotoğrafı kapat"
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-[10px] border border-white/10 bg-black shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-zinc-300 hover:bg-black/80 hover:text-white"
        >
          ×
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Yorum fotoğrafı"
          className="max-h-[85vh] w-full object-contain"
        />
      </div>
    </div>,
    document.body,
  );
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
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);

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

  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
    // Only revoke on unmount; individual removes revoke themselves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleReviews = useMemo(() => {
    const start = (page - 1) * REVIEWS_PER_PAGE;
    return reviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [reviews, page]);

  const clearPhotos = () => {
    setPhotos((current) => {
      current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      return [];
    });
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    document.getElementById("product-reviews-list")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  };

  const handlePhotoSelect = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setError("");

    const remaining = MAX_REVIEW_IMAGES - photos.length;
    if (remaining <= 0) {
      setError(`En fazla ${MAX_REVIEW_IMAGES} fotoğraf ekleyebilirsiniz.`);
      return;
    }

    const next: PendingPhoto[] = [];
    for (const file of Array.from(fileList).slice(0, remaining)) {
      const isImage =
        file.type.startsWith("image/") ||
        /\.(jpe?g|png|webp|heic)$/i.test(file.name);
      if (!isImage) {
        setError("Sadece JPG, PNG veya WebP yükleyebilirsiniz.");
        continue;
      }
      if (file.size > MAX_REVIEW_PHOTO_BYTES) {
        setError("Her fotoğraf en fazla 8 MB olabilir.");
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (next.length) {
      setPhotos((current) => [...current, ...next].slice(0, MAX_REVIEW_IMAGES));
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const paths: string[] = [];
    for (const photo of photos) {
      const formData = new FormData();
      formData.append("file", photo.file);
      const response = await fetch(`/api/products/${productId}/reviews/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Fotoğraf yüklenemedi.");
      }
      paths.push(String(data.path));
    }
    return paths;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const images = await uploadPhotos();

      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          rating,
          text,
          website: "",
          images,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Yorum gönderilemedi.");
      }

      setAuthorName("");
      setRating(5);
      setText("");
      clearPhotos();
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
            Deneyiminizi paylaşın; isterseniz posteri evinizde gösteren fotoğraf
            da ekleyin.
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

            <div className="sm:col-span-2">
              <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                Fotoğraf ({photos.length}/{MAX_REVIEW_IMAGES})
              </span>
              <p className="mt-1 text-xs text-zinc-500">
                Telefondan veya galeriden ekleyin. İsteğe bağlı, en fazla{" "}
                {MAX_REVIEW_IMAGES} fotoğraf.
              </p>

              <div className="mt-3 flex flex-wrap gap-2.5">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative h-20 w-20 overflow-hidden rounded-[8px] border border-white/10 bg-zinc-950"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.previewUrl}
                      alt="Seçilen fotoğraf"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      aria-label="Fotoğrafı kaldır"
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {photos.length < MAX_REVIEW_IMAGES && (
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-white/15 text-zinc-500 transition-colors hover:border-amber-300/40 hover:text-amber-100">
                    <span className="text-lg leading-none">+</span>
                    <span className="mt-1 text-[10px]">Ekle</span>
                    <input
                      type="file"
                      accept="image/*,image/heic,image/heif,.jpg,.jpeg,.png,.webp"
                      capture="environment"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        handlePhotoSelect(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
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

            {review.images && review.images.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {review.images.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setLightboxSrc(src)}
                    className="relative h-24 w-24 overflow-hidden rounded-[8px] border border-white/10 bg-zinc-950 transition-opacity hover:opacity-90 sm:h-28 sm:w-28"
                    aria-label="Yorum fotoğrafını büyüt"
                  >
                    <Image
                      src={src}
                      alt={`${review.authorName} yorum fotoğrafı`}
                      fill
                      className="object-cover"
                      sizes="112px"
                      unoptimized={isUploadImageSrc(src)}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <ReviewPagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {lightboxSrc ? (
        <ReviewPhotoLightbox
          src={lightboxSrc}
          onClose={() => setLightboxSrc(null)}
        />
      ) : null}
    </section>
  );
}
