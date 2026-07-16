import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createProduct, getProducts } from "@/lib/db/products-store";
import { defaultViewLabels, slugify } from "@/lib/product-utils";
import type { PosterSize } from "@/lib/types";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      name: string;
      slug?: string;
      description: string;
      category: string;
      badge?: string;
      viewCount: 2 | 3;
      viewLabels?: string[];
      basePrice: number;
      priceA3: number;
      priceA2: number;
      priceA1: number;
      featured?: boolean;
      published?: boolean;
    };

    const slug = body.slug?.trim() || slugify(body.name);
    const viewCount = body.viewCount;
    const viewLabels = body.viewLabels?.length
      ? body.viewLabels
      : defaultViewLabels(viewCount);

    const product = await createProduct({
      name: body.name,
      slug,
      description: body.description,
      category: body.category,
      badge: body.badge,
      viewCount,
      viewLabels,
      basePrice: body.basePrice,
      sizePrices: {
        A3: body.priceA3,
        A2: body.priceA2,
        A1: body.priceA1,
      } as Record<PosterSize, number>,
      featured: body.featured,
      published: body.published,
    });

    revalidatePath("/");
    revalidatePath("/shop");
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
