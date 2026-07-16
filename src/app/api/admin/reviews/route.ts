import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { listAllReviews } from "@/lib/db/reviews-store";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const reviews = await listAllReviews();
  return NextResponse.json({ reviews });
}
