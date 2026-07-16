"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

type ViewFilter = "all" | "2" | "3";
type SortMode = "featured" | "price-asc" | "price-desc" | "name";

type ShopProductGridProps = {
  products: Product[];
};

export function ShopProductGrid({ products }: ShopProductGridProps) {
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortMode>("featured");

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );

  const visibleProducts = useMemo(() => {
    return products
      .filter((product) =>
        viewFilter === "all" ? true : product.viewCount === Number(viewFilter),
      )
      .filter((product) => (category === "all" ? true : product.category === category))
      .sort((a, b) => {
        if (sort === "price-asc") return a.basePrice - b.basePrice;
        if (sort === "price-desc") return b.basePrice - a.basePrice;
        if (sort === "name") return a.name.localeCompare(b.name, "tr");
        if (a.featured !== b.featured) return Number(b.featured) - Number(a.featured);
        return a.name.localeCompare(b.name, "tr");
      });
  }, [category, products, sort, viewFilter]);

  return (
    <div className="mt-8 sm:mt-10">
      <div className="rounded-[8px] border border-white/10 bg-white/[0.025] p-3">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div>
            <p className="mb-2 text-[10px] font-medium tracking-wide text-zinc-500 uppercase">
              Açı sayısı
            </p>
            <div className="grid grid-cols-3 rounded-full border border-white/10 bg-black/25 p-1">
              <FilterButton
                active={viewFilter === "all"}
                onClick={() => setViewFilter("all")}
              >
                Tümü
              </FilterButton>
              <FilterButton
                active={viewFilter === "2"}
                onClick={() => setViewFilter("2")}
              >
                2 açı
              </FilterButton>
              <FilterButton
                active={viewFilter === "3"}
                onClick={() => setViewFilter("3")}
              >
                3 açı
              </FilterButton>
            </div>
          </div>

          <label>
            <span className="mb-2 block text-[10px] font-medium tracking-wide text-zinc-500 uppercase">
              Kategori
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 w-full rounded-[8px] border border-white/10 bg-[#101012] px-3 text-sm text-white outline-none focus:border-amber-300/40"
            >
              <option value="all">Tüm kategoriler</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-[10px] font-medium tracking-wide text-zinc-500 uppercase">
              Sırala
            </span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortMode)}
              className="h-11 w-full rounded-[8px] border border-white/10 bg-[#101012] px-3 text-sm text-white outline-none focus:border-amber-300/40 lg:w-44"
            >
              <option value="featured">Öne çıkanlar</option>
              <option value="price-asc">Fiyat artan</option>
              <option value="price-desc">Fiyat azalan</option>
              <option value="name">İsme göre</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
        <span>{visibleProducts.length} ürün gösteriliyor</span>
        <span>Set indirimi sepette otomatik hesaplanır</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} animatedPreview />
        ))}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 rounded-full px-3 text-xs font-semibold transition-colors ${
        active ? "bg-white text-black" : "text-zinc-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
