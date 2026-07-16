const items = [
  {
    title: "PayTR güvenli ödeme",
    text: "Kart bilgileriniz şifreli altyapıyla korunur.",
  },
  {
    title: "Korumalı kargo",
    text: "Posterler hasar görmemesi için özenle paketlenir.",
  },
  {
    title: "Set indirimi",
    text: "2 posterde %10, 3+ posterde %15 indirim.",
  },
  {
    title: "Kolay iade",
    text: "Sorunlu teslimatlar için destek ekibimiz yanınızda.",
  },
] as const;

export function TrustStrip() {
  return (
    <section className="border-t border-white/10 bg-[#0b0b0c] px-4 py-10 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.title}
            className="rounded-[8px] border border-white/10 bg-white/[0.02] px-4 py-4"
          >
            <h3 className="text-sm font-semibold text-white">{item.title}</h3>
            <p className="mt-1.5 text-xs leading-6 text-zinc-500">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
