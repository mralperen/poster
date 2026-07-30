import { NextResponse } from "next/server";
import {
  getProductById,
  registerProductVideoPath,
} from "@/lib/db/products-store";
import {
  findLatestProductVideoPath,
  verifyUploadBlobExists,
} from "@/lib/video-upload-server";

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
  let videoPath = product?.video;

  if (!product || product.published === false) {
    return NextResponse.json(
      { error: "Ürün videosu bulunamadı." },
      {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  // Eski bug: katalog video.mp4 derken dosya video-{timestamp}.mp4 olarak
  // yazılmış olabilir. Blob'daki gerçek son videoyu bulup yolu düzelt.
  if (
    !videoPath?.startsWith("/uploads/") ||
    !(await verifyUploadBlobExists(videoPath))
  ) {
    const recovered = await findLatestProductVideoPath(id);
    if (recovered) {
      videoPath = recovered;
      try {
        await registerProductVideoPath(id, recovered);
      } catch {
        /* oynatma yine de devam etsin */
      }
    }
  }

  if (!videoPath?.startsWith("/uploads/")) {
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
