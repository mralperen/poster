import Link from "next/link";
import { getOrderById } from "@/lib/db/orders-store";
import { formatPrice } from "@/lib/format";

type FailPageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function CheckoutFailPage({ searchParams }: FailPageProps) {
  const { order: orderId } = await searchParams;
  const order = orderId ? await getOrderById(orderId) : undefined;

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-400/30 bg-red-400/10 text-2xl text-red-300">
        ×
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-white">Ödeme tamamlanamadı</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-500">
        İşlem iptal edildi veya banka tarafından reddedildi. Kart bilgilerinizi kontrol edip
        tekrar deneyebilirsiniz.
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
        {order ? (
          <Link
            href={`/checkout/pay/${order.id}`}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black"
          >
            Tekrar dene
          </Link>
        ) : (
          <Link
            href="/checkout"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black"
          >
            Ödemeye dön
          </Link>
        )}
        <Link
          href="/cart"
          className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-zinc-300"
        >
          Sepete git
        </Link>
      </div>
    </div>
  );
}
