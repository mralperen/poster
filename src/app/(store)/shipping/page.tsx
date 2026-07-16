import { InfoGrid, InfoPage } from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Kargo Koşulları | The Posterist",
  description:
    "Lentiküler poster siparişlerinde kargo süresi, paketleme ve teslimat koşulları. Korumalı gönderim.",
  path: "/shipping",
});

export default async function ShippingPage() {
  const { shipping } = await getSiteContent();

  return (
    <InfoPage
      eyebrow={shipping.eyebrow}
      title={shipping.title}
      description={shipping.description}
    >
      <InfoGrid items={shipping.items} />
    </InfoPage>
  );
}
