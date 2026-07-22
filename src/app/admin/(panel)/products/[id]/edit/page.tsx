import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductById } from "@/lib/db/products-store";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <div>
      <Link
        href="/admin/products"
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← Ürünlere dön
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">{product.name}</h1>
      <p className="mt-1 text-sm text-zinc-500">Poster düzenle ve görselleri güncelle</p>
      <div className="mt-8">
        <ProductForm mode="edit" product={product} />
      </div>
    </div>
  );
}
