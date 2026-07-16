import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { isAdminAuthenticated } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Admin",
  noIndex: true,
});

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <>
      <AdminNav />
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </>
  );
}
