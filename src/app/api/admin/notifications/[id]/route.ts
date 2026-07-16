import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { markNotificationRead } from "@/lib/db/admin-notifications-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  const { id } = await context.params;
  const notification = await markNotificationRead(id);

  if (!notification) {
    return NextResponse.json({ error: "Bildirim bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ notification });
}
