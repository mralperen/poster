import { hasSuccessfulOrderEmail } from "@/lib/db/email-log-store";
import { listOrders } from "@/lib/db/orders-store";
import { handleOrderPaid } from "@/lib/order-paid";

export type BackfillOrderEmailResult = {
  scanned: number;
  sent: number;
  skipped: number;
  failed: number;
  results: Array<{
    orderId: string;
    customerEmail: string;
    customerName: string;
    status: "sent" | "skipped" | "failed";
    reason?: string;
  }>;
};

export async function backfillMissingOrderEmails(): Promise<BackfillOrderEmailResult> {
  const orders = await listOrders();
  const paidOrders = orders.filter(
    (order) => order.status === "paid" || order.status === "fulfilled",
  );

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const results: BackfillOrderEmailResult["results"] = [];

  for (const order of paidOrders) {
    const alreadySent = await hasSuccessfulOrderEmail(
      order.id,
      "order_confirmation",
    );

    if (alreadySent) {
      skipped += 1;
      results.push({
        orderId: order.id,
        customerEmail: order.customer.email,
        customerName: order.customer.name,
        status: "skipped",
      });
      continue;
    }

    try {
      await handleOrderPaid(order);
      const confirmed = await hasSuccessfulOrderEmail(
        order.id,
        "order_confirmation",
      );

      if (confirmed) {
        sent += 1;
        results.push({
          orderId: order.id,
          customerEmail: order.customer.email,
          customerName: order.customer.name,
          status: "sent",
        });
      } else {
        failed += 1;
        results.push({
          orderId: order.id,
          customerEmail: order.customer.email,
          customerName: order.customer.name,
          status: "failed",
          reason: "Onay e-postası gönderilemedi.",
        });
      }
    } catch (error) {
      failed += 1;
      results.push({
        orderId: order.id,
        customerEmail: order.customer.email,
        customerName: order.customer.name,
        status: "failed",
        reason:
          error instanceof Error ? error.message : "Bilinmeyen hata oluştu.",
      });
    }
  }

  return {
    scanned: paidOrders.length,
    sent,
    skipped,
    failed,
    results,
  };
}
