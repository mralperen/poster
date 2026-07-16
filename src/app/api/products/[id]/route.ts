import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  deleteProduct,
  getProductById,
  updateProduct,
} from "@/lib/db/products-store";
import type { PosterSize } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  if (product.published === false && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      name?: string;
      slug?: string;
      description?: string;
      category?: string;
      badge?: string;
      viewCount?: 2 | 3;
      viewLabels?: string[];
      basePrice?: number;
      priceA3?: number;
      priceA2?: number;
      priceA1?: number;
      featured?: boolean;
      published?: boolean;
    };

    const product = await updateProduct(id, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      category: body.category,
      badge: body.badge,
      viewCount: body.viewCount,
      viewLabels: body.viewLabels,
      basePrice: body.basePrice,
      sizePrices:
        body.priceA3 !== undefined
          ? ({
              A3: body.priceA3,
              A2: body.priceA2!,
              A1: body.priceA1!,
            } as Record<PosterSize, number>)
          : undefined,
      featured: body.featured,
      published: body.published,
    });

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath(`/product/${product.slug}`);
    return NextResponse.json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Güncelleme başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id } = await context.params;
  const product = await getProductById(id);

  try {
    await deleteProduct(id);
    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin");
    revalidatePath("/admin/products");
    if (product) revalidatePath(`/product/${product.slug}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Silme başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
