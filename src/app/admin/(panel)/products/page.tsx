import Image from "next/image";
import Link from "next/link";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { getProducts, productHasAllViews } from "@/lib/db/products-store";
import { formatPrice } from "@/lib/format";
import { withImageVersion } from "@/lib/image-version";

export default async function AdminProductsPage() {
  const products = await getProducts();

  const statuses = await Promise.all(
    products.map(async (p) => ({
      id: p.id,
      ready: await productHasAllViews(p),
    })),
  );
  const statusMap = Object.fromEntries(statuses.map((s) => [s.id, s.ready]));

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Posterler</h1>
          <p className="mt-1 text-sm text-zinc-500">
            3D lentiküler ürün yönetimi · {products.length} ürün
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-300"
        >
          + Yeni Poster
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {products.map((product) => {
          const ready = statusMap[product.id];
          const isDraft = product.published === false || !ready;

          return (
            <div
              key={product.id}
              className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.02] p-4"
            >
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-zinc-900">
                <Image
                  src={withImageVersion(product.thumbnail, product.updatedAt)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium text-white">{product.name}</h2>
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500">
                    {product.viewCount} açı
                  </span>
                  {isDraft ? (
                    <span className="rounded bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-400">
                      Taslak
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                      Yayında
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-600">
                  /product/{product.slug} · {formatPrice(product.basePrice)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/product/${product.slug}`}
                  className="rounded border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                  target="_blank"
                >
                  Görüntüle
                </Link>
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="rounded border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-300"
                >
                  Düzenle
                </Link>
                <DeleteProductButton id={product.id} name={product.name} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
