"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { PosterScrubber } from "@/components/PosterScrubber";
import { formatPrice } from "@/lib/format";
import { isUploadImageSrc, withImageVersion } from "@/lib/image-version";
import type { Product } from "@/lib/types";

type LenticularHeroProps = {
  products: Product[];
};

const SCENE_WORDS: Record<number, string> = {
  1: "Tek",
  2: "İki",
  3: "Üç",
  4: "Dört",
  5: "Beş",
};

function fallbackViewLabels(count: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    index === 0 ? "Sol" : index === count - 1 ? "Sağ" : "Orta",
  );
}

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

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = products[(selectedIndex + 1) % products.length];
        if (next) setSelectedId(next.id);
      }
      if (event.key === "ArrowUp") {
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
  const viewCount = selectedViews.length;
  const viewLabels =
    selected.viewLabels?.length === viewCount
      ? selected.viewLabels
      : fallbackViewLabels(viewCount);
  const sceneWord = SCENE_WORDS[viewCount] ?? String(viewCount);

  const selectByOffset = (offset: number) => {
    const next =
      products[(selectedIndex + offset + products.length) % products.length];
    if (next) setSelectedId(next.id);
  };

  return (
    <section className="relative isolate overflow-x-clip bg-[#eef2f3] text-zinc-950">
      <div className="hero-lens-grid pointer-events-none absolute inset-0" />
      <div className="hero-spotlight pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-9 pb-14 sm:gap-9 sm:px-6 sm:pt-12 lg:grid lg:min-h-[calc(100svh-72px)] lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14 lg:pt-10 lg:pb-16">
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-9">
          <div className="order-1 min-w-0 lg:order-none">
            <p className="text-[11px] font-semibold tracking-[0.26em] text-zinc-500 uppercase">
              3D Lentiküler Poster · A3
            </p>

            <h1 className="mt-4 text-[2.7rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              Tek baskı.
              <br />
              {sceneWord} sahne.
            </h1>

            <p className="mt-5 max-w-md text-[0.95rem] leading-7 text-zinc-600 sm:mt-6 sm:text-base sm:leading-8">
              Bakış açın değiştikçe poster başka bir kareye geçer.
            </p>
          </div>

          <div className="order-3 min-w-0 lg:order-none">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
              Aynı baskı, {viewCount} açı
            </p>

            <div className="mt-3 flex items-center gap-2 sm:gap-3">
              {selectedViews.map((src, index) => (
                <Fragment key={`${src}-${index}`}>
                  {index > 0 ? <AngleArrow /> : null}
                  <div className="relative aspect-[3/4] w-[4.75rem] shrink-0 overflow-hidden rounded-[6px] border border-zinc-950/10 bg-zinc-900 shadow-[0_4px_14px_rgba(9,9,10,0.12)] sm:w-[5.5rem]">
                    <Image
                      src={src}
                      alt={`${selected.name} — ${viewLabels[index]}`}
                      fill
                      sizes="88px"
                      className="object-cover"
                      unoptimized={isUploadImageSrc(selected.views[index] ?? "")}
                    />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/90 to-transparent px-1.5 pt-5 pb-1 text-[9px] font-medium tracking-wide text-zinc-100 uppercase">
                      {viewLabels[index]}
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>

          <div className="order-4 flex min-w-0 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center lg:order-none">
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
              Tüm koleksiyon
            </Link>
          </div>
        </div>

        <div className="order-2 min-w-0 lg:order-none">
          <div className="relative grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_5.5rem] lg:items-stretch lg:gap-5">
            <div className="hero-stage relative mx-auto w-full min-w-0 max-w-[380px] sm:max-w-[420px] lg:mx-0 lg:max-w-none">
              <div className="poster-wood-frame relative z-10">
                <div className="poster-wood-frame__mat">
                  <PosterScrubber
                    key={selected.id}
                    views={selectedViews}
                    viewLabels={viewLabels}
                    alt={selected.name}
                    className="mx-auto w-full"
                    priority
                    woodFrame
                    autoDemo
                  />
                </div>
              </div>
            </div>

            {products.length > 1 ? (
              <aside className="hero-gallery-rail flex min-h-0 min-w-0 flex-col lg:h-full">
                <div className="mb-2 flex items-center justify-between gap-3 lg:mb-2.5">
                  <p className="text-[10px] font-semibold tracking-[0.22em] text-zinc-500 uppercase">
                    Seç
                  </p>
                  <p className="font-mono text-[10px] tabular-nums text-zinc-500">
                    {String(selectedIndex + 1).padStart(2, "0")}
                    <span className="text-zinc-400"> / </span>
                    {String(products.length).padStart(2, "0")}
                  </p>
                </div>

                <div className="mb-2 hidden gap-1.5 lg:flex">
                  <button
                    type="button"
                    onClick={() => selectByOffset(-1)}
                    className="flex h-7 flex-1 items-center justify-center rounded-[6px] border border-zinc-950/12 bg-white/50 text-zinc-700 transition-colors hover:border-zinc-950/25 hover:bg-white"
                    aria-label="Önceki poster"
                  >
                    <Chevron direction="up" />
                  </button>
                  <button
                    type="button"
                    onClick={() => selectByOffset(1)}
                    className="flex h-7 flex-1 items-center justify-center rounded-[6px] border border-zinc-950/12 bg-white/50 text-zinc-700 transition-colors hover:border-zinc-950/25 hover:bg-white"
                    aria-label="Sonraki poster"
                  >
                    <Chevron direction="down" />
                  </button>
                </div>

                <div
                  ref={railRef}
                  className="hero-gallery-rail__track -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:mx-0 lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-2 lg:overflow-y-auto lg:overflow-x-hidden lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
                >
                  {products.map((product, index) => {
                    const active = product.id === selected.id;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        data-hero-thumb={product.id}
                        onClick={() => setSelectedId(product.id)}
                        className={`hero-gallery-thumb group relative aspect-[3/4] w-[4rem] shrink-0 overflow-hidden rounded-[7px] text-left transition-[transform,opacity,box-shadow] duration-300 sm:w-[4.75rem] lg:w-full ${
                          active
                            ? "z-10 border-2 border-zinc-950 opacity-100 shadow-[0_8px_22px_rgba(9,9,10,0.16)] lg:scale-[1.02]"
                            : "border border-zinc-950/10 opacity-45 hover:opacity-90"
                        }`}
                        aria-label={`${product.name} ürününü göster`}
                        aria-current={active ? "true" : undefined}
                      >
                        <Image
                          src={withImageVersion(product.thumbnail, product.updatedAt)}
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

          <div className="mt-5 grid gap-2 border-t border-zinc-950/12 pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase">
                Vitrinde
              </p>
              <h2 className="mt-1 text-base font-semibold leading-snug text-zinc-950 sm:truncate sm:text-xl">
                {selected.name}
              </h2>
            </div>
            <p className="text-xl font-bold tabular-nums text-zinc-950 sm:justify-self-end sm:text-2xl">
              {formatPrice(selected.basePrice)}
            </p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-5 hidden justify-center lg:flex">
        <span className="hero-scroll-cue flex flex-col items-center gap-1.5 text-[10px] font-medium tracking-[0.24em] text-zinc-400 uppercase">
          Koleksiyon
          <Chevron direction="down" />
        </span>
      </div>
    </section>
  );
}

function AngleArrow() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0 text-zinc-400"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
