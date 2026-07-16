import { ContentEditor } from "@/components/admin/ContentEditor";
import { pageTitle } from "@/lib/brand";
import { getSiteContent } from "@/lib/site-content";

export const metadata = {
  title: pageTitle("İçerik Yönetimi"),
};

export default async function AdminContentPage() {
  const content = await getSiteContent();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Site içerikleri</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
          Hakkımızda, iletişim, kargo, iade, satış sözleşmesi ve S.S.S.
          sayfalarını buradan düzenleyebilirsin.
        </p>
      </div>
      <ContentEditor initialContent={content} />
    </div>
  );
}
