import { createOrderNotification } from "@/lib/db/admin-notifications-store";
import type { StoredOrder } from "@/lib/db/orders-store";
import { sendOrderPaidEmails } from "@/lib/order-email";

export async function handleOrderPaid(order: StoredOrder): Promise<void> {
  if (order.status !== "paid" && order.status !== "fulfilled") return;

  await createOrderNotification(order);
  void sendOrderPaidEmails(order);
}
