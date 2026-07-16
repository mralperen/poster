import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { deleteReview, getReviewById, setReviewPublished } from "@/lib/db/reviews-store";
import { revalidateReviewPaths } from "@/lib/revalidate-reviews";
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { published?: boolean };

  if (typeof body.published !== "boolean") {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }

  const review = await setReviewPublished(id, body.published);
  if (!review) {
    return NextResponse.json({ error: "Yorum bulunamadı." }, { status: 404 });
  }

  await revalidateReviewPaths(review.productId);

  return NextResponse.json({ review });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await getReviewById(id);
  const deleted = await deleteReview(id);

  if (!deleted) {
    return NextResponse.json({ error: "Yorum bulunamadı." }, { status: 404 });
  }

  if (existing) {
    await revalidateReviewPaths(existing.productId);
  }

  return NextResponse.json({ ok: true });
}
