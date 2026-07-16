import { NextResponse } from "next/server";
import { createProductReview, listProductReviews } from "@/lib/db/reviews-store";
import { getProductById } from "@/lib/db/products-store";
import { consumeRateLimit } from "@/lib/rate-limit";
import { resolveClientIp } from "@/lib/paytr";

type RouteContext = { params: Promise<{ id: string }> };

const REVIEW_LIMIT = 5;
const REVIEW_WINDOW_MS = 60 * 60 * 1000;

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const product = await getProductById(id);

  if (!product || product.published === false) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  const reviews = await listProductReviews(id);
  return NextResponse.json({ reviews });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const product = await getProductById(id);

  if (!product || product.published === false) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  const userIp = resolveClientIp(request);
  const rate = await consumeRateLimit(
    `review:${userIp}`,
    REVIEW_LIMIT,
    REVIEW_WINDOW_MS,
  );

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Çok fazla yorum denemesi. ${rate.retryAfterSec ?? 3600} saniye sonra tekrar deneyin.`,
      },
      { status: 429 },
    );
  }

  const body = (await request.json()) as {
    authorName?: string;
    rating?: number;
    text?: string;
    website?: string;
  };

  if (body.website?.trim()) {
    return NextResponse.json({ ok: true });
  }

  const authorName = body.authorName?.trim() ?? "";
  const text = body.text?.trim() ?? "";
  const rating = Number(body.rating);

  if (!authorName || authorName.length < 2) {
    return NextResponse.json({ error: "Ad soyad gerekli." }, { status: 400 });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "1–5 arası puan seçin." }, { status: 400 });
  }

  if (!text || text.length < 10) {
    return NextResponse.json(
      { error: "Yorum en az 10 karakter olmalı." },
      { status: 400 },
    );
  }

  if (text.length > 2000 || authorName.length > 60) {
    return NextResponse.json({ error: "Yorum çok uzun." }, { status: 400 });
  }

  const review = await createProductReview({
    productId: id,
    authorName,
    rating,
    body: text,
  });

  return NextResponse.json({ review }, { status: 201 });
}
