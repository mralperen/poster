import { brand } from "@/lib/brand";
import { absoluteUrl } from "@/lib/seo";

export function SiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${absoluteUrl()}/#organization`,
        name: brand.name,
        url: absoluteUrl(),
        logo: absoluteUrl("/favicon.png"),
        email: brand.supportEmail,
        sameAs: [brand.instagramUrl],
      },
      {
        "@type": "WebSite",
        "@id": `${absoluteUrl()}/#website`,
        url: absoluteUrl(),
        name: brand.name,
        description:
          "Türkiye'nin 3D lentiküler poster mağazası. Açıya göre değişen premium duvar posterleri.",
        publisher: { "@id": `${absoluteUrl()}/#organization` },
        inLanguage: "tr-TR",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${absoluteUrl("/shop")}?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Store",
        "@id": `${absoluteUrl()}/#store`,
        name: brand.name,
        url: absoluteUrl("/shop"),
        image: absoluteUrl("/og-image.jpg"),
        priceRange: "₺₺",
        currenciesAccepted: "TRY",
        paymentAccepted: "Credit Card",
        areaServed: "TR",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
