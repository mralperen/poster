"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PosterScrubber } from "@/components/PosterScrubber";
import { formatPrice } from "@/lib/format";
import { isUploadImageSrc, withImageVersion } from "@/lib/image-version";
import type { Product } from "@/lib/types";

type LenticularHeroProps = {
  products: Product[];
};

export function LenticularHero({ products }: LenticularHeroProps) {
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? "");
  const railRef = useRef<HTMLDivElement>(null);
  const selected =
    products.find((product) => product.id === selectedId) ?? products[0];
  const selectedIndex = Math.max(
    0,
    products.findIndex((product) => product.id === selected?.id),
  );

  useEffect(() => {
    const node = railRef.current?.querySelector<HTMLElement>(
      `[data-hero-thumb="${selectedId}"]`,
    );
    node?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [selectedId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (products.length < 2) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        const next = products[(selectedIndex + 1) % products.length];
        if (next) setSelectedId(next.id);
      }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        const prev =
          products[(selectedIndex - 1 + products.length) % products.length];
        if (prev) setSelectedId(prev.id);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [products, selectedIndex]);

  if (!selected) return null;

  const selectedViews = selected.views.map((src) =>
    withImageVersion(src, selected.updatedAt),
  );

  const selectByOffset = (offset: number) => {
    const next =
      products[(selectedIndex + offset + products.length) % products.length];
    if (next) setSelectedId(next.id);
  };

  return (
    <section className="relative isolate overflow-x-clip bg-[#eef2f3] text-zinc-950">
      <div className="lenticular-field absolute inset-0 opacity-70" />
      <div className="lens-sweep absolute inset-y-0 left-0 w-1/3 opacity-60" />

      <div className="relative mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-7 px-4 py-7 sm:gap-8 sm:px-6 sm:py-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:py-12">
        <div className="min-w-0 max-w-2xl">
          <h1 className="max-w-[12ch] text-[2.55rem] font-semibold leading-[1.08] tracking-tight sm:max-w-[14ch] sm:text-6xl sm:leading-[1.02] lg:text-8xl lg:leading-[0.95]">
            Tek Çerçeve, Sonsuz Değişim.
          </h1>

          <p className="mt-5 max-w-lg text-[0.95rem] leading-7 text-zinc-600 sm:mt-6 sm:text-lg">
            Durağan posterleri unut. Tek bir çerçevede birden fazla sahneyi canlı
            geçişini gör.
          </p>

          <div className="mt-8 hidden flex-wrap items-center gap-3 lg:flex">
            <Link
              href={`/product/${selected.slug}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Bu posteri incele
            </Link>
            <Link
              href="/shop"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-950/20 px-6 text-sm font-semibold text-zinc-950 transition-colors hover:border-zinc-950/40 hover:bg-white/60"
            >
              Koleksiyona bak
            </Link>
          </div>
        </div>

        <div className="relative min-w-0">
          <div className="pointer-events-none absolute inset-x-0 top-8 hidden h-24 border-y border-zinc-950/10 opacity-70 sm:block" />

          <div className="relative grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_7.5rem] lg:items-stretch lg:gap-6">
            <div className="poster-wood-frame relative mx-auto w-full min-w-0 max-w-[440px] lg:mx-0 lg:max-w-none">
              <div className="poster-wood-frame__mat">
                <PosterScrubber
                  key={selected.id}
                  views={selectedViews}
                  viewLabels={selected.viewLabels}
                  alt={selected.name}
                  className="mx-auto w-full max-w-[440px]"
                  priority
                  woodFrame
                />
              </div>
            </div>

            {products.length > 1 ? (
              <aside className="hero-gallery-rail flex min-h-0 min-w-0 flex-col lg:h-full">
                <div className="mb-2 flex items-center justify-between gap-3 lg:mb-3">
                  <p className="text-[11px] font-semibold tracking-[0.22em] text-zinc-500 uppercase">
                    Seç
                  </p>
                  <p className="font-mono text-[11px] tabular-nums text-zinc-500">
                    {String(selectedIndex + 1).padStart(2, "0")}
                    <span className="text-zinc-400"> / </span>
                    {String(products.length).padStart(2, "0")}
                  </p>
                </div>

                <div className="mb-2 hidden gap-1.5 lg:flex">
                  <button
                    type="button"
                    onClick={() => selectByOffset(-1)}
                    className="flex h-8 flex-1 items-center justify-center rounded-[6px] border border-zinc-950/12 bg-white/50 text-zinc-700 transition-colors hover:border-zinc-950/25 hover:bg-white"
                    aria-label="Önceki poster"
                  >
                    <Chevron direction="up" />
                  </button>
                  <button
                    type="button"
                    onClick={() => selectByOffset(1)}
                    className="flex h-8 flex-1 items-center justify-center rounded-[6px] border border-zinc-950/12 bg-white/50 text-zinc-700 transition-colors hover:border-zinc-950/25 hover:bg-white"
                    aria-label="Sonraki poster"
                  >
                    <Chevron direction="down" />
                  </button>
                </div>

                <div
                  ref={railRef}
                  className="hero-gallery-rail__track -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:mx-0 lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-2.5 lg:overflow-y-auto lg:overflow-x-hidden lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
                >
                  {products.map((product, index) => {
                    const active = product.id === selected.id;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        data-hero-thumb={product.id}
                        onClick={() => setSelectedId(product.id)}
                        className={`hero-gallery-thumb group relative aspect-[3/4] w-[4.25rem] shrink-0 overflow-hidden rounded-[7px] text-left transition-[transform,opacity,box-shadow] duration-300 sm:w-[5rem] lg:w-full ${
                          active
                            ? "z-10 border-2 border-zinc-950 opacity-100 shadow-[0_8px_22px_rgba(9,9,10,0.16)] lg:scale-[1.02]"
                            : "border border-zinc-950/10 opacity-45 hover:opacity-90"
                        }`}
                        aria-label={`${product.name} ürününü göster`}
                        aria-current={active ? "true" : undefined}
                      >
                        <Image
                          src={withImageVersion(
                            product.thumbnail,
                            product.updatedAt,
                          )}
                          alt=""
                          fill
                          aria-hidden
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          sizes="96px"
                          unoptimized={isUploadImageSrc(product.thumbnail)}
                        />
                        <span
                          className={`absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent transition-opacity ${
                            active ? "opacity-100" : "opacity-70"
                          }`}
                        />
                        <span
                          className={`absolute bottom-1.5 left-1.5 font-mono text-[10px] font-semibold tracking-wide ${
                            active ? "text-white" : "text-white/80"
                          }`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </aside>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 border-t border-zinc-950/12 pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium tracking-[0.18em] text-zinc-500 uppercase">
                Vitrin
              </p>
              <h2 className="mt-1 text-base font-semibold leading-snug text-zinc-950 sm:truncate sm:text-xl">
                {selected.name}
              </h2>
            </div>
            <p className="text-xl font-bold tabular-nums text-zinc-950 sm:justify-self-end sm:text-2xl">
              {formatPrice(selected.basePrice)}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:hidden">
            <Link
              href={`/product/${selected.slug}`}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white"
            >
              Bu posteri incele
            </Link>
            <Link
              href="/shop"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-zinc-950/20 px-5 text-sm font-semibold text-zinc-950"
            >
              Koleksiyona bak
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Chevron({ direction }: { direction: "up" | "down" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={direction === "up" ? "M6 14l6-6 6 6" : "M6 10l6 6 6-6"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
