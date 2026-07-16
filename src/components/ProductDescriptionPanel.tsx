"use client";

import { useId, useState } from "react";

type ProductDescriptionPanelProps = {
  name: string;
  description: string;
  viewCount: number;
  sizeLabel: string;
};

export function ProductDescriptionPanel({
  name,
  description,
  viewCount,
  sizeLabel,
}: ProductDescriptionPanelProps) {
  const [open, setOpen] = useState(true);
  const panelId = useId();

  const paragraphs = description
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const showDescription =
    paragraphs.length > 0 &&
    !(
      paragraphs.length === 1 &&
      paragraphs[0].localeCompare(name, "tr", { sensitivity: "accent" }) === 0
    );

  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.025]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
      >
        <span className="text-sm font-semibold text-white">Ürün Açıklaması</span>
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center text-lg leading-none text-zinc-400"
          aria-hidden
        >
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className="border-t border-white/8 px-4 pb-5 pt-4 sm:px-5"
        >
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-8">
            <div className="space-y-4 text-sm leading-6 text-zinc-300">
              {showDescription ? (
                <div className="space-y-3">
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p>
                  Açı değiştirdikçe farklı görseller arasında geçiş yapan lentiküler
                  poster; duvara asıldığında hareketli bir obje gibi hissettirir.
                </p>
              )}

              <ul className="list-disc space-y-1.5 pl-5 text-zinc-400">
                <li>{sizeLabel} sabit ölçü</li>
                <li>{viewCount} farklı görünüm — sürükleyerek deneyin</li>
                <li>Çerçevesiz, duvara hazır lentiküler baskı</li>
                <li>Lens yüzeyi korumalı ambalajla gönderilir</li>
              </ul>
            </div>

            <div className="space-y-3 text-xs leading-6 text-zinc-500 sm:border-l sm:border-white/8 sm:pl-8">
              <p>
                Üretim sürecinde renk ve geçiş hizasında çok küçük farklılıklar
                oluşabilir; bu durum ürünün kalitesini etkilemez.
              </p>
              <p className="font-medium text-amber-200/90">
                Duvara asmak için düz bir yüzey seçin; lensli yüzeyi temiz bezle silin.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
