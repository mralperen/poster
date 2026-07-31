import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { markOrderShipped } from "@/lib/db/orders-store";
import { sendOrderShippedEmail } from "@/lib/order-email";

type RouteContext = { params: Promise<{ orderId: string }> };

type ShipBody = {
  trackingNumber?: string;
};

export async function POST(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  const { orderId } = await context.params;

  let body: ShipBody = {};
  try {
    body = (await request.json()) as ShipBody;
  } catch {
    /* optional body */
  }

  const result = await markOrderShipped(orderId, {
    trackingNumber: body.trackingNumber,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 422 });
  }

  const emailResult = await sendOrderShippedEmail(result.order);

  revalidatePath("/admin/orders");
  revalidatePath("/admin/emails");

  return NextResponse.json({
    ok: true,
    order: result.order,
    emailSent: emailResult.ok,
    emailError: emailResult.ok ? undefined : emailResult.reason,
  });
}
