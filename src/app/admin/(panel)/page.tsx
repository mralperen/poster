import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getAdminDashboardData } from "@/lib/admin-dashboard-stats";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();
  return <AdminDashboard data={data} />;
}
