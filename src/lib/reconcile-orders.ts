import {
  listOrders,
  reconcileOrderWithPaytrCallbacks,
  type StoredOrder,
} from "@/lib/db/orders-store";
import { handleOrderPaid } from "@/lib/order-paid";

export async function listOrdersWithReconciliation(): Promise<StoredOrder[]> {
  const orders = await listOrders();

  return Promise.all(
    orders.map(async (order) => {
      const reconciled = await reconcileOrderWithPaytrCallbacks(order);
      if (
        reconciled.status === "paid" &&
        order.status !== "paid" &&
        order.status !== "fulfilled"
      ) {
        void handleOrderPaid(reconciled);
      }
      return reconciled;
    }),
  );
}
