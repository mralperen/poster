import { NextResponse } from "next/server";
import { getProductById } from "@/lib/db/products-store";

type RouteContext = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/**
 * Video düğmesine basıldığında güncel ürün kaydını Blob'dan okuyup
 * benzersiz medya yoluna yönlendirir. Böylece ürün sayfasındaki eski
 * katalog belleği, değiştirilmiş videonun gösterilmesini engellemez.
 */
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const product = await getProductById(id, { forceRefresh: true });
  const videoPath = product?.video;

  if (
    !product ||
    product.published === false ||
    !videoPath?.startsWith("/uploads/")
  ) {
    return NextResponse.json(
      { error: "Ürün videosu bulunamadı." },
      {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const target = new URL(videoPath, request.url);
  target.searchParams.set("v", product.updatedAt ?? videoPath);

  return NextResponse.redirect(target, {
    status: 307,
    headers: { "Cache-Control": "no-store" },
  });
}
