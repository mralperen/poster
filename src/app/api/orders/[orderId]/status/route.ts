import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/db/orders-store";
import { listOrdersWithReconciliation } from "@/lib/reconcile-orders";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  let order = await getOrderById(orderId, { maxAttempts: 4, retryDelayMs: 300 });

  if (order?.status === "pending_payment") {
    const reconciled = await listOrdersWithReconciliation();
    order = reconciled.find((item) => item.id === orderId) ?? order;
  }

  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({
    status: order.status,
    paid: order.status === "paid" || order.status === "fulfilled",
  });
}
