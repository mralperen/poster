import { listOrdersWithReconciliation } from "@/lib/reconcile-orders";
import { AdminOrdersList } from "@/components/admin/AdminOrdersList";

export default async function AdminOrdersPage() {
  const orders = await listOrdersWithReconciliation();
  return <AdminOrdersList orders={orders} />;
}
