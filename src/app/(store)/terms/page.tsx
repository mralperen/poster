import Link from "next/link";
import { InfoGrid, InfoPage } from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Mesafeli Satış Sözleşmesi | The Posterist",
  description:
    "The Posterist online mağaza mesafeli satış sözleşmesi, ödeme, teslimat ve cayma hakkı bilgileri.",
  path: "/terms",
});

export default async function TermsPage() {
  const { terms, general } = await getSiteContent();

  return (
    <InfoPage
      eyebrow={terms.eyebrow}
      title={terms.title}
      description={terms.description}
    >
      <div className="rounded-[8px] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-white">Satıcı bilgileri</h2>
        <dl className="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
          <div>
            <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
              Unvan
            </dt>
            <dd className="mt-1 text-zinc-300">{general.companyLegalName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
              Adres
            </dt>
            <dd className="mt-1 text-zinc-300">{general.businessAddress}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
              İletişim
            </dt>
            <dd className="mt-1 text-zinc-300">
              <a
                href={`mailto:${general.supportEmail}`}
                className="text-amber-200 hover:underline"
              >
                {general.supportEmail}
              </a>
              {" · "}
              <a href={`tel:${general.supportPhone.replace(/\s/g, "")}`} className="hover:underline">
                {general.supportPhone}
              </a>
            </dd>
          </div>
          {(general.taxOffice || general.taxNumber) && (
            <div>
              <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                Vergi bilgisi
              </dt>
              <dd className="mt-1 text-zinc-300">
                {[general.taxOffice, general.taxNumber].filter(Boolean).join(" · ")}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-8">
        <InfoGrid items={terms.items} />
      </div>

      <p className="mt-8 text-sm leading-6 text-zinc-500">
        Teslimat koşulları için{" "}
        <Link href="/shipping" className="text-amber-200 hover:underline">
          Kargo
        </Link>
        , iade koşulları için{" "}
        <Link href="/returns" className="text-amber-200 hover:underline">
          İade
        </Link>{" "}
        sayfalarına bakabilirsiniz.
      </p>
    </InfoPage>
  );
}
