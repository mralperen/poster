import { NextResponse } from "next/server";
import { CheckoutValidationError, resolveCheckoutCart } from "@/lib/checkout";
import { createOrder } from "@/lib/db/orders-store";
import { getCartPricing, normalizeFrameOption } from "@/lib/pricing";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  createPaytrIframeToken,
  isPaytrConfigured,
  PaytrConfigError,
  resolveClientIp,
} from "@/lib/paytr";

const CHECKOUT_LIMIT = 12;
const CHECKOUT_WINDOW_MS = 15 * 60 * 1000;

type CheckoutBody = {
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    zip?: string;
  };
  items?: Array<{
    productId?: string;
    quantity?: number;
    frameOption?: string;
  }>;
};

export async function POST(request: Request) {
  try {
    const userIp = resolveClientIp(request);
    const rate = await consumeRateLimit(
      `checkout:${userIp}`,
      CHECKOUT_LIMIT,
      CHECKOUT_WINDOW_MS,
    );

    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Çok fazla sipariş denemesi. ${rate.retryAfterSec ?? 60} saniye sonra tekrar deneyin.`,
        },
        { status: 429 },
      );
    }

    const body = (await request.json()) as CheckoutBody;
    const customer = body.customer;

    if (
      !customer?.name?.trim() ||
      !customer.email?.trim() ||
      !customer.phone?.trim() ||
      !customer.address?.trim() ||
      !customer.city?.trim()
    ) {
      return NextResponse.json(
        { error: "Teslimat bilgileri eksik." },
        { status: 400 },
      );
    }

    if (!isPaytrConfigured()) {
      return NextResponse.json(
        {
          error:
            "PayTR yapılandırması eksik. Ödeme alınamıyor; lütfen mağaza yöneticisiyle iletişime geçin.",
        },
        { status: 503 },
      );
    }

    const lines = (body.items ?? []).map((item) => ({
      productId: String(item.productId ?? ""),
      quantity: Number(item.quantity ?? 0),
      frameOption: normalizeFrameOption(item.frameOption),
    }));

    const items = await resolveCheckoutCart(lines);
    const totals = getCartPricing(items);

    const order = await createOrder({
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
        city: customer.city.trim(),
        zip: customer.zip?.trim() ?? "",
      },
      items,
      totals: {
        rawSubtotal: totals.rawSubtotal,
        discountTotal: totals.discountTotal,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        total: totals.total,
        bundleDiscountRate: totals.bundleDiscountRate,
      },
    });

    const tokenResult = await createPaytrIframeToken({ order, userIp });

    if (!tokenResult.ok) {
      return NextResponse.json(
        { error: tokenResult.reason, orderId: order.id },
        { status: 502 },
      );
    }

    return NextResponse.json({
      orderId: order.id,
      provider: "paytr",
      paytrToken: tokenResult.token,
      paymentUrl: `/checkout/pay/${order.id}`,
    });
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof PaytrConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Sipariş oluşturulamadı." },
      { status: 500 },
    );
  }
}
