"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PosterScrubber } from "@/components/PosterScrubber";
import { formatPrice } from "@/lib/format";
import { isUploadImageSrc, withImageVersion } from "@/lib/image-version";
import type { Product } from "@/lib/types";

type LenticularHeroProps = {
  products: Product[];
};

const accents = ["#f6c85f", "#79d8ff", "#b8f28b", "#ff8f7a"];

export function LenticularHero({ products }: LenticularHeroProps) {
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? "");
  const selected = products.find((product) => product.id === selectedId) ?? products[0];

  if (!selected) return null;
  const selectedViews = selected.views.map((src) =>
    withImageVersion(src, selected.updatedAt),
  );

  return (
    <section className="relative isolate overflow-hidden bg-[#eef2f3] text-zinc-950">
      <div className="lenticular-field absolute inset-0 opacity-70" />
      <div className="lens-sweep absolute inset-y-0 left-0 w-1/3 opacity-60" />

      <div className="relative mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:py-12">
        <div className="max-w-2xl">
          <h1 className="max-w-[14ch] text-5xl font-semibold leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl">
            Tek Çerçeve, Sonsuz Değişim.
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-zinc-600 sm:text-lg">
            Durağan posterleri unut. Tek bir çerçevede birden fazla sahneyi canlı geçişini gör.
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

        <div className="relative">
          <div className="absolute -inset-x-4 top-8 h-24 border-y border-zinc-950/10 opacity-70" />
          <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_104px] lg:items-start">
            <div className="poster-wood-frame relative min-w-0">
              <div className="poster-wood-frame__mat">
                <PosterScrubber
                  key={selected.id}
                  views={selectedViews}
                  viewLabels={selected.viewLabels}
                  alt={selected.name}
                  className="mx-auto max-w-[440px]"
                  priority
                  woodFrame
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:w-[104px] lg:shrink-0 lg:flex-col lg:gap-2.5 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
              {products.map((product, index) => {
                const active = product.id === selected.id;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedId(product.id)}
                    className={`group relative aspect-[3/4] w-[22%] shrink-0 overflow-hidden rounded-[8px] border border-zinc-950/15 text-left transition-[opacity,box-shadow] lg:w-full ${
                      active
                        ? "z-10 border-zinc-950 opacity-100 shadow-[0_0_0_2px_#09090a]"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    aria-label={`${product.name} ürününü göster`}
                    aria-current={active ? "true" : undefined}
                  >
                    <Image
                      src={withImageVersion(product.thumbnail, product.updatedAt)}
                      alt=""
                      fill
                      aria-hidden
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="104px"
                      unoptimized={isUploadImageSrc(product.thumbnail)}
                    />
                    <span
                      className="absolute inset-x-0 bottom-0 h-1"
                      style={{ backgroundColor: accents[index % accents.length] }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 border-t border-zinc-950/12 pt-4">
            <h2 className="min-w-0 truncate text-lg font-semibold text-zinc-950 sm:text-xl">
              {selected.name}
            </h2>
            <p className="shrink-0 text-xl font-bold tabular-nums text-zinc-950 sm:text-2xl">
              {formatPrice(selected.basePrice)}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 lg:hidden">
            <Link
              href={`/product/${selected.slug}`}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white sm:flex-none sm:px-6"
            >
              Bu posteri incele
            </Link>
            <Link
              href="/shop"
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-zinc-950/20 px-5 text-sm font-semibold text-zinc-950 sm:flex-none sm:px-6"
            >
              Koleksiyona bak
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
