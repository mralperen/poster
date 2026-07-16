import Link from "next/link";
import { ClearCartOnSuccess } from "@/components/ClearCartOnSuccess";
import { OrderStatusPoller } from "@/components/OrderStatusPoller";
import { getOrderById } from "@/lib/db/orders-store";
import { formatPrice } from "@/lib/format";

type SuccessPageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { order: orderId } = await searchParams;
  const order = orderId
    ? await getOrderById(orderId, { maxAttempts: 8, retryDelayMs: 400 })
    : undefined;

  const isPaid = order?.status === "paid" || order?.status === "fulfilled";
  const isPending = order?.status === "pending_payment";

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <ClearCartOnSuccess orderId={orderId} />
      <OrderStatusPoller orderId={orderId} initialStatus={order?.status} />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-2xl text-emerald-300">
        ✓
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-white">
        {isPaid ? "Ödemeniz alındı" : "Ödeme işlemi tamamlandı"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-500">
        {isPaid
          ? "Siparişiniz onaylandı. Onay e-postası birkaç dakika içinde gelir; gelmezse destek ile iletişime geçin."
          : isPending
            ? "Ödeme sonucu birkaç saniye içinde sisteme yansır. Onaylandığında e-posta gönderilir."
            : "Sipariş kaydınız oluşturuldu. Ödeme durumunu destek hattından takip edebilirsiniz."}
      </p>

      {order && (
        <div className="mt-6 rounded-[10px] border border-white/10 bg-white/[0.025] p-4 text-left text-sm">
          <p className="text-xs text-zinc-500">
            Sipariş referansı{" "}
            <span className="font-mono text-zinc-400">{order.id.slice(0, 8)}</span>
          </p>
          <p className="mt-2 text-white">{formatPrice(order.totals.total)}</p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/shop"
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black"
        >
          Alışverişe devam et
        </Link>
        <Link
          href="/contact"
          className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-zinc-300"
        >
          Destek
        </Link>
      </div>
    </div>
  );
}
