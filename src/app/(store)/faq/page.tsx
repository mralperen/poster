import { InfoPage } from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Sıkça Sorulan Sorular | Lentiküler Poster — The Posterist",
  description:
    "Lentiküler poster ölçüsü, kargo, iade, ödeme ve bakım hakkında sık sorulan sorular. The Posterist destek merkezi.",
  path: "/faq",
});

export default async function FaqPage() {
  const { faq } = await getSiteContent();

  return (
    <InfoPage eyebrow={faq.eyebrow} title={faq.title} description={faq.description}>
      <div className="divide-y divide-white/10 rounded-[8px] border border-white/10 bg-white/[0.025]">
        {faq.items.map((item) => (
          <details key={item.question} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-white">
              {item.question}
              <span className="text-xl leading-none text-zinc-500 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}
