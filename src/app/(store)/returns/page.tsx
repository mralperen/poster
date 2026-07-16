import { InfoGrid, InfoPage } from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "İade ve Değişim | The Posterist",
  description:
    "The Posterist lentiküler poster iade ve değişim koşulları. Cayma hakkı ve destek süreci.",
  path: "/returns",
});

export default async function ReturnsPage() {
  const { returns } = await getSiteContent();

  return (
    <InfoPage
      eyebrow={returns.eyebrow}
      title={returns.title}
      description={returns.description}
    >
      <InfoGrid items={returns.items} />
    </InfoPage>
  );
}
