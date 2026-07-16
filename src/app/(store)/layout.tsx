import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSiteContent } from "@/lib/site-content";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { general } = await getSiteContent();

  return (
    <>
      <Header campaignText={general.campaignText} />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
    </>
  );
}
