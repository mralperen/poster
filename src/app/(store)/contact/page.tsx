import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "İletişim | The Posterist Destek",
  description:
    "Sipariş, ürün ve iş birliği sorularınız için The Posterist destek ekibiyle iletişime geçin.",
  path: "/contact",
});

export default async function ContactPage() {
  const { contact, general } = await getSiteContent();

  return (
    <InfoPage
      eyebrow={contact.eyebrow}
      title={contact.title}
      description={contact.description}
    >
      <div
        id="adres"
        className="rounded-[8px] border border-white/10 bg-white/[0.025] p-5 sm:p-6"
      >
        <h2 className="text-sm font-semibold text-white">{general.companyLegalName}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{general.businessAddress}</p>
        <p className="mt-3 text-sm text-zinc-400">
          <a href={`mailto:${general.supportEmail}`} className="text-amber-200 hover:underline">
            {general.supportEmail}
          </a>
          {" · "}
          <a
            href={`tel:${general.supportPhone.replace(/\s/g, "")}`}
            className="text-amber-200 hover:underline"
          >
            {general.supportPhone}
          </a>
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {contact.cards.map((card) => (
          <ContactCard
            key={`${card.title}-${card.href}`}
            title={card.title}
            value={card.value}
            href={card.href}
          />
        ))}
      </div>

      {contact.note && (
        <div className="mt-8 rounded-[8px] border border-amber-200/20 bg-amber-300/5 p-5 text-sm leading-7 text-zinc-300">
          {contact.note}
        </div>
      )}
    </InfoPage>
  );
}

function ContactCard({
  title,
  value,
  href,
}: {
  title: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[8px] border border-white/10 bg-white/[0.025] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.045]"
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase">
        {title}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </Link>
  );
}
