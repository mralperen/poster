"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { PosterScrubber } from "@/components/PosterScrubber";
import { withImageVersion } from "@/lib/image-version";
import { STANDARD_POSTER_SIZE_LABEL, FRAMELESS_DISCOUNT } from "@/lib/pricing";
import { defaultViewLabels, slugify } from "@/lib/product-utils";
import type { Product } from "@/lib/types";

type ProductFormProps = {
  product?: Product;
  mode: "create" | "edit";
};

const SLOT_HINTS: Record<number, string[]> = {
  2: [
    "Poster sola eğikken çekilmiş fotoğraf (veya sol görünüm)",
    "Poster sağa eğikken çekilmiş fotoğraf (veya sağ görünüm)",
  ],
  3: [
    "Sol açıdan çekim — poster sola eğik",
    "Ortadan düz çekim — poster karşıdan",
    "Sağ açıdan çekim — poster sağa eğik",
  ],
};

export function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState(product?.category ?? "3D Lentiküler");
  const [badge, setBadge] = useState(product?.badge ?? "");
  const [viewCount, setViewCount] = useState<2 | 3>(product?.viewCount ?? 2);
  const [viewLabels, setViewLabels] = useState<string[]>(
    product?.viewLabels ?? defaultViewLabels(2),
  );
  const [price, setPrice] = useState(product?.basePrice ?? 949);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [published, setPublished] = useState(product?.published !== false);

  const [localPreviews, setLocalPreviews] = useState<(string | null)[]>([]);
  const [uploadedViews, setUploadedViews] = useState<string[]>(
    product?.views.map((src) => withImageVersion(src, product.updatedAt)) ?? [],
  );
  const [imageRevision, setImageRevision] = useState(0);
  const [videoSrc, setVideoSrc] = useState(
    product?.video ? withImageVersion(product.video, product.updatedAt) : "",
  );
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const previewViews = useMemo(() => {
    return Array.from({ length: viewCount }, (_, i) => {
      if (localPreviews[i]) return localPreviews[i]!;
      if (uploadedViews[i]) return uploadedViews[i];
      return "";
    });
  }, [viewCount, localPreviews, uploadedViews]);

  const canPreview = previewViews.every(Boolean);

  const hasAllViews = useMemo(() => {
    if (mode === "create" && !product) {
      return localPreviews.filter(Boolean).length === viewCount;
    }
    return uploadedViews.length === viewCount && uploadedViews.every(Boolean);
  }, [mode, product, localPreviews, uploadedViews, viewCount]);
  const isLive = hasAllViews && published;

  const handleViewCountChange = (count: 2 | 3) => {
    setViewCount(count);
    setViewLabels(defaultViewLabels(count));
    setLocalPreviews((prev) =>
      Array.from({ length: count }, (_, i) => prev[i] ?? null),
    );
  };

  const updateLabel = (index: number, value: string) => {
    setViewLabels((prev) => prev.map((l, i) => (i === index ? value : l)));
  };

  const uploadImage = useCallback(
    async (productId: string, slot: number, file: File) => {
      const formData = new FormData();
      formData.append("slot", String(slot));
      formData.append("file", file);

      const res = await fetch(`/api/products/${productId}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Yükleme başarısız.");
      return data.path as string;
    },
    [],
  );

  const handleFileChange = async (slot: number, file: File | null) => {
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setSuccess("");
    setLocalPreviews((prev) => {
      const next = [...prev];
      next[slot] = preview;
      return next;
    });

    if (mode === "edit" && product) {
      setUploadingSlot(slot);
      setError("");
      try {
        const path = await uploadImage(product.id, slot, file);
        const freshPath = `${path.split("?")[0]}?v=${Date.now()}`;
        setUploadedViews((prev) => {
          const next = [...prev];
          next[slot] = freshPath;
          return next;
        });
        setLocalPreviews((prev) => {
          const next = [...prev];
          next[slot] = null;
          return next;
        });
        setSuccess(
          "Görsel yüklendi. Son bilgileri kaydetmek için Değişiklikleri Kaydet'e basabilirsiniz.",
        );
        setImageRevision((r) => r + 1);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Yükleme hatası.");
      } finally {
        setUploadingSlot(null);
      }
    }
  };

  const handleVideoChange = async (file: File | null) => {
    if (!file || mode !== "edit" || !product) return;

    if (file.size > 80 * 1024 * 1024) {
      setError("Video en fazla 80 MB olabilir.");
      return;
    }

    const extension =
      file.type === "video/webm"
        ? "webm"
        : file.type === "video/mp4"
          ? "mp4"
          : null;

    if (!extension) {
      setError("Sadece MP4 veya WebM yükleyebilirsiniz.");
      return;
    }

    setUploadingVideo(true);
    setError("");
    setSuccess("");

    const pathname = `uploads/${product.id}/video.${extension}`;

    try {
      let publicPath = "";

      try {
        const { upload } = await import("@vercel/blob/client");
        const blob = await upload(pathname, file, {
          access: "private",
          handleUploadUrl: `/api/products/${product.id}/upload-video`,
          multipart: true,
          contentType: file.type,
        });

        const registerRes = await fetch(
          `/api/products/${product.id}/upload-video`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "register",
              pathname: blob.pathname || pathname,
            }),
          },
        );
        const registerData = await registerRes.json();
        if (!registerRes.ok) {
          throw new Error(registerData.error ?? "Video kaydı başarısız.");
        }
        publicPath = String(registerData.path ?? `/${pathname}`);
      } catch (clientError) {
        // Blob client upload yoksa / lokal: sunucu FormData yolu
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/products/${product.id}/upload-video`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error ??
              (clientError instanceof Error
                ? clientError.message
                : "Video yüklenemedi."),
          );
        }
        publicPath = String(data.path);
      }

      setVideoSrc(`${publicPath.split("?")[0]}?v=${Date.now()}`);
      setSuccess("Ürün videosu yüklendi. Ayrıca “Kaydet”e basmanıza gerek yok.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video yükleme hatası.");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingSlot !== null) {
      setError("Görsel yüklemesi bitmeden kaydetmeyin.");
      return;
    }
    if (uploadingVideo) {
      setError("Video yüklemesi bitmeden kaydetmeyin.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      name,
      slug: slug || slugify(name),
      description,
      category,
      badge,
      viewCount,
      viewLabels,
      basePrice: price,
      priceA3: price,
      priceA2: price,
      priceA1: price,
      featured,
      published,
    };

    try {
      if (mode === "create") {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Oluşturulamadı.");

        for (let slot = 0; slot < viewCount; slot++) {
          const input = document.getElementById(`file-${slot}`) as HTMLInputElement;
          const file = input?.files?.[0];
          if (file) await uploadImage(data.id, slot, file);
        }

        router.push(`/admin/products/${data.id}/edit`);
        router.refresh();
        return;
      }

      if (!product) return;

      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Güncellenemedi.");
      setUploadedViews(
        data.views.map((view: string) => `${view.split("?")[0]}?v=${Date.now()}`),
      );
      if (typeof data.video === "string" && data.video) {
        setVideoSrc(`${data.video.split("?")[0]}?v=${Date.now()}`);
      }
      setSuccess("Değişiklikler kaydedildi.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-6">
        <Section title="Ürün bilgileri">
          <Field label="Poster adı" value={name} onChange={setName} required />
          <Field
            label="URL slug"
            value={slug}
            onChange={setSlug}
            placeholder={slugify(name)}
            hint="Boş bırakırsanız otomatik oluşturulur"
          />
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase">
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400/40"
            />
          </div>
          <Field label="Kategori" value={category} onChange={setCategory} />
          <Field
            label="Ürün rozeti"
            value={badge}
            onChange={setBadge}
            placeholder={`${viewCount} açı · seçili koleksiyon`}
            hint="Kart ve ürün detayında küçük etiket olarak görünür."
          />
        </Section>

        <Section title="3D lentiküler açı sayısı">
          <div className="grid grid-cols-2 gap-3">
            {([2, 3] as const).map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => handleViewCountChange(count)}
                className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  viewCount === count
                    ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                    : "border-white/10 text-zinc-400 hover:border-white/20"
                }`}
              >
                <span className="font-medium">{count} açılı</span>
                <span className="mt-1 block text-xs opacity-70">
                  {count === 2 ? "Sol + Sağ" : "Sol + Orta + Sağ"}
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Görünüm fotoğrafları">
          <p className="mb-4 text-xs leading-relaxed text-zinc-500">
            Her açı için ayrı fotoğraf yükleyin. Sistem tüm görselleri{" "}
            <strong className="text-zinc-400">900×1200</strong> aynı boyuta
            getirir — kaydırma kusursuz çalışır. Yapay zeka ile düzenlediğiniz
            görselleri de yükleyebilirsiniz.
          </p>

          {Array.from({ length: viewCount }).map((_, slot) => (
            <div
              key={slot}
              className="mb-4 rounded-xl border border-white/8 bg-white/[0.02] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <input
                    value={viewLabels[slot] ?? ""}
                    onChange={(e) => updateLabel(slot, e.target.value)}
                    className="w-full rounded border border-white/10 bg-transparent px-2 py-1 text-sm text-white outline-none focus:border-amber-400/40"
                  />
                  <p className="mt-1 text-[11px] text-zinc-600">
                    {SLOT_HINTS[viewCount][slot]}
                  </p>
                </div>
                {uploadingSlot === slot && (
                  <span className="text-xs text-amber-400">Yükleniyor…</span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-4">
                <div className="relative h-20 w-16 overflow-hidden rounded bg-zinc-900">
                  {(localPreviews[slot] || uploadedViews[slot]) && (
                    <Image
                      key={`${slot}-${imageRevision}`}
                      src={
                        localPreviews[slot] ??
                        uploadedViews[slot]
                      }
                      alt=""
                      fill
                      loading="eager"
                      unoptimized={!!localPreviews[slot]}
                      className="object-cover"
                      sizes="64px"
                    />
                  )}
                </div>
                <label className="cursor-pointer rounded-lg border border-dashed border-white/15 px-4 py-2 text-xs text-zinc-400 hover:border-amber-400/30 hover:text-zinc-300">
                  Görsel seç (JPG, PNG, WebP)
                  <input
                    id={`file-${slot}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      handleFileChange(slot, e.target.files?.[0] ?? null)
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </Section>

        {mode === "edit" && product && (
          <Section title="Ürün videosu">
            <p className="text-xs leading-5 text-zinc-500">
              MP4 veya WebM (en fazla 80 MB). Video seçilir seçilmez yüklenir;
              ayrıca “Kaydet”e basmanız gerekmez. Mağazada ürün adının yanında
              Video butonu görünür.
            </p>
            {videoSrc ? (
              <video
                src={videoSrc}
                controls
                playsInline
                className="mt-2 max-h-52 w-full rounded-lg bg-black"
              />
            ) : null}
            <label className="mt-3 inline-flex cursor-pointer rounded-lg border border-dashed border-white/15 px-4 py-2 text-xs text-zinc-400 hover:border-amber-400/30 hover:text-zinc-300">
              {uploadingVideo
                ? "Video yükleniyor…"
                : videoSrc
                  ? "Videoyu değiştir"
                  : "Video yükle"}
              <input
                type="file"
                accept="video/mp4,video/webm"
                className="hidden"
                disabled={uploadingVideo}
                onChange={(e) => handleVideoChange(e.target.files?.[0] ?? null)}
              />
            </label>
          </Section>
        )}

        <Section title="Satış fiyatı">
          <PriceField
            label="Çerçeveli fiyat (₺)"
            value={price}
            onChange={setPrice}
          />
          <p className="text-xs leading-5 text-zinc-500">
            Standart gönderim çerçevelidir. Çerçevesiz seçenek otomatik olarak{" "}
            <span className="text-zinc-300">
              {Math.max(0, price - FRAMELESS_DISCOUNT)} ₺
            </span>{" "}
            olur (−{FRAMELESS_DISCOUNT} ₺). Ölçü: {STANDARD_POSTER_SIZE_LABEL}.
          </p>
        </Section>

        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="rounded border-white/20"
          />
          Öne çıkan ürün olarak göster
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="rounded border-white/20"
          />
          Mağazada yayında
        </label>

        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || uploadingSlot !== null || uploadingVideo}
          className="w-full rounded-lg bg-amber-400 py-3 text-sm font-semibold text-black hover:bg-amber-300 disabled:opacity-50"
        >
          {uploadingVideo
            ? "Video yükleniyor…"
            : uploadingSlot !== null
            ? "Görsel yükleniyor…"
            : saving
              ? "Kaydediliyor…"
            : mode === "create"
              ? "Ürünü Oluştur"
              : "Değişiklikleri Kaydet"}
        </button>
      </div>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <Section title="Canlı önizleme">
          <p className="mb-4 text-xs text-zinc-500">
            Mağazada müşterilerin göreceği 3D lentiküler kaydırma deneyimi.
          </p>
          {canPreview ? (
            <PosterScrubber
              views={previewViews}
              viewLabels={viewLabels}
              alt={name || "Önizleme"}
            />
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-sm border border-dashed border-white/10 bg-zinc-900/50 text-center text-xs text-zinc-500">
              Açı fotoğraflarını yükleyin —
              <br />
              önizleme burada görünecek
            </div>
          )}
          <div className="mt-4 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-xs text-zinc-500">
            {isLive ? (
              <span className="text-emerald-400">
                ✓ Tüm açılar yüklü — mağazada yayında
              </span>
            ) : hasAllViews ? (
              <span className="text-amber-400">
                Tüm açılar yüklü — mağazada görünmesi için &quot;Mağazada yayında&quot;
                seçeneğini açıp kaydedin.
              </span>
            ) : (
              <span className="text-amber-400">
                Tüm açı fotoğrafları yüklenince önizleme aktif olur.
              </span>
            )}
          </div>
        </Section>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-500 uppercase">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400/40"
      />
      {hint && <p className="mt-1 text-[11px] text-zinc-600">{hint}</p>}
    </div>
  );
}

function PriceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-500 uppercase">
        {label}
      </label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400/40"
      />
    </div>
  );
}
