import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { clearAllNotifications } from "@/lib/db/admin-notifications-store";
import { clearAllSalesData } from "@/lib/db/orders-store";
import { writeTextFile } from "@/lib/db/storage";

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  try {
    const sales = await clearAllSalesData();
    const notificationsCleared = await clearAllNotifications();

    // Eski Shopier webhook kayıtları da satış geçmişi sayılır
    await writeTextFile("data/shopier-webhooks.json", "[]\n");

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/payments");

    return NextResponse.json({
      ok: true,
      message: "Tüm satışlar ve istatistikler temizlendi.",
      ...sales,
      notificationsCleared,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Satışlar temizlenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
