import { NextResponse } from "next/server";
import { getProductById } from "@/lib/db/products-store";
import {
  MAX_REVIEW_IMAGES,
  saveReviewImage,
} from "@/lib/db/reviews-store";
import { processReviewImage } from "@/lib/image-process";
import { resolveClientIp } from "@/lib/paytr";
import { consumeRateLimit } from "@/lib/rate-limit";
import { MAX_REVIEW_PHOTO_BYTES } from "@/lib/review-constants";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_BYTES = MAX_REVIEW_PHOTO_BYTES;
const UPLOAD_LIMIT = 20;
const UPLOAD_WINDOW_MS = 60 * 60 * 1000;

export const maxDuration = 60;

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const product = await getProductById(id);

  if (!product || product.published === false) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  const userIp = resolveClientIp(request);
  const rate = await consumeRateLimit(
    `review-upload:${userIp}`,
    UPLOAD_LIMIT,
    UPLOAD_WINDOW_MS,
  );

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Çok fazla fotoğraf yüklemesi. ${rate.retryAfterSec ?? 3600} saniye sonra tekrar deneyin.`,
      },
      { status: 429 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Geçersiz yükleme." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Her fotoğraf en fazla 8 MB olabilir." },
        { status: 400 },
      );
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!allowed.includes(file.type) && !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) {
      return NextResponse.json(
        { error: "Sadece JPG, PNG veya WebP yükleyebilirsiniz." },
        { status: 400 },
      );
    }

    const raw = Buffer.from(await file.arrayBuffer());
    const processed = await processReviewImage(raw);
    const path = await saveReviewImage(id, processed);

    return NextResponse.json({
      ok: true,
      path,
      maxImages: MAX_REVIEW_IMAGES,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yükleme başarısız.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
