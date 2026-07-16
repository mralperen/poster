import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getOrderByPaytrMerchantOid,
  recordPaytrCallback,
  reconcileOrderWithPaytrCallbacks,
  updateOrderStatus,
} from "@/lib/db/orders-store";
import { handleOrderPaid } from "@/lib/order-paid";
import { verifyPaytrCallbackHash } from "@/lib/paytr";

type PaytrCallbackBody = {
  merchant_oid?: string;
  status?: string;
  total_amount?: string;
  hash?: string;
  payment_type?: string;
  failed_reason_msg?: string;
};

export async function POST(request: Request) {
  let body: PaytrCallbackBody;

  try {
    const formData = await request.formData();
    body = {
      merchant_oid: String(formData.get("merchant_oid") ?? ""),
      status: String(formData.get("status") ?? ""),
      total_amount: String(formData.get("total_amount") ?? ""),
      hash: String(formData.get("hash") ?? ""),
      payment_type: String(formData.get("payment_type") ?? ""),
      failed_reason_msg: String(formData.get("failed_reason_msg") ?? ""),
    };
  } catch {
    try {
      body = (await request.json()) as PaytrCallbackBody;
    } catch {
      return new NextResponse("OK", { status: 200 });
    }
  }

  const merchantOid = body.merchant_oid?.trim();
  const status = body.status?.trim();
  const totalAmount = body.total_amount?.trim();
  const hash = body.hash?.trim();

  if (!merchantOid || !status || !totalAmount || !hash) {
    return new NextResponse("OK", { status: 200 });
  }

  const signatureVerified = verifyPaytrCallbackHash({
    merchantOid,
    status,
    totalAmount,
    hash,
  });

  await recordPaytrCallback({
    id: randomUUID(),
    merchantOid,
    status,
    totalAmount,
    paymentType: body.payment_type || undefined,
    failedReason: body.failed_reason_msg || undefined,
    signatureVerified,
    receivedAt: new Date().toISOString(),
  });

  if (!signatureVerified) {
    console.error("PayTR callback hash doğrulanamadı:", merchantOid);
    return new NextResponse("OK", { status: 200 });
  }

  const order = await getOrderByPaytrMerchantOid(merchantOid, {
    maxAttempts: 12,
    retryDelayMs: 500,
  });
  if (!order) {
    console.error("PayTR callback için sipariş bulunamadı:", merchantOid);
    return new NextResponse("OK", { status: 200 });
  }

  if (order.status === "paid" || order.status === "fulfilled") {
    return new NextResponse("OK", { status: 200 });
  }

  const expectedAmount = Math.round(order.totals.total * 100);
  const paidAmount = Number(totalAmount);
  if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount) {
    console.error(
      "PayTR callback tutar uyuşmazlığı:",
      merchantOid,
      paidAmount,
      expectedAmount,
    );
    return new NextResponse("OK", { status: 200 });
  }

  if (status === "success") {
    let updated = await updateOrderStatus(order.id, "paid", {
      paytrPaidAmount: paidAmount / 100,
    });

    if (!updated || updated.status !== "paid") {
      updated = await reconcileOrderWithPaytrCallbacks(order);
    }

    if (
      updated.status === "paid" &&
      (order.status === "pending_payment" || order.status === "failed")
    ) {
      void handleOrderPaid(updated);
    }
  } else {
    await updateOrderStatus(order.id, "failed");
  }

  return new NextResponse("OK", { status: 200 });
}
