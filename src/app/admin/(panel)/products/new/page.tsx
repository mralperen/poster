import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <Link
        href="/admin"
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← Ürünlere dön
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">
        Yeni 3D Lentiküler Poster
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Açı fotoğraflarını yükleyin — mağazada otomatik kaydırılabilir olacak.
      </p>
      <div className="mt-8">
        <ProductForm mode="create" />
      </div>
    </div>
  );
}
