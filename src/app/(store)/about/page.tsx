import { InfoGrid, InfoPage } from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Hakkımızda | The Posterist — Lentiküler Poster Atölyesi",
  description:
    "The Posterist'in hikayesi: açıya göre değişen 3D lentiküler posterleri tasarlayıp üreten Türkiye merkezli marka.",
  path: "/about",
});

export default async function AboutPage() {
  const { about } = await getSiteContent();

  return (
    <InfoPage
      eyebrow={about.eyebrow}
      title={about.title}
      description={about.description}
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5 text-sm leading-7 text-zinc-400">
          {about.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <InfoGrid items={about.cards} />
      </div>
    </InfoPage>
  );
}
