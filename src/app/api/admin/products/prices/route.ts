import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { setAllProductBasePrices } from "@/lib/db/products-store";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { basePrice?: number };
    const basePrice = Number(body.basePrice);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      return NextResponse.json({ error: "Geçersiz fiyat." }, { status: 400 });
    }

    const products = await setAllProductBasePrices(basePrice);

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin");
    revalidatePath("/admin/products");
    for (const product of products) {
      revalidatePath(`/product/${product.slug}`);
      revalidatePath(`/admin/products/${product.id}/edit`);
    }

    return NextResponse.json({
      ok: true,
      basePrice,
      updated: products.length,
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        basePrice: product.basePrice,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Fiyatlar güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
