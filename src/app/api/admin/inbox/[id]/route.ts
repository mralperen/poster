import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { markInboxEmailRead } from "@/lib/db/inbox-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  const { id } = await context.params;
  const email = await markInboxEmailRead(id);

  if (!email) {
    return NextResponse.json({ error: "E-posta bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ email });
}
