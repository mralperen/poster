import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/db/orders-store";
import {
  createPaytrIframeToken,
  isPaytrConfigured,
  PaytrConfigError,
  resolveClientIp,
} from "@/lib/paytr";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { orderId } = await context.params;

    if (!isPaytrConfigured()) {
      return NextResponse.json(
        { error: "PayTR yapılandırması eksik." },
        { status: 503 },
      );
    }

    const order = await getOrderById(orderId, { maxAttempts: 10, retryDelayMs: 400 });
    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    }

    if (order.status === "paid" || order.status === "fulfilled") {
      return NextResponse.json({
        redirect: `/checkout/success?order=${order.id}`,
        status: order.status,
      });
    }

    if (order.status === "failed") {
      return NextResponse.json({
        redirect: `/checkout/fail?order=${order.id}`,
        status: order.status,
      });
    }

    const userIp = resolveClientIp(request);
    const tokenResult = await createPaytrIframeToken({ order, userIp });

    if (!tokenResult.ok) {
      return NextResponse.json({ error: tokenResult.reason }, { status: 502 });
    }

    return NextResponse.json({
      token: tokenResult.token,
      orderId: order.id,
      total: order.totals.total,
      status: order.status,
    });
  } catch (error) {
    if (error instanceof PaytrConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Pay session error:", error);
    return NextResponse.json({ error: "Ödeme oturumu açılamadı." }, { status: 500 });
  }
}
