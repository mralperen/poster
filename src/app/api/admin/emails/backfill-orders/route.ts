import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { backfillMissingOrderEmails } from "@/lib/backfill-order-emails";

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    const result = await backfillMissingOrderEmails();

    revalidatePath("/admin/emails");

    return NextResponse.json({
      ok: true,
      message:
        result.sent > 0
          ? `${result.sent} eksik sipariş onay e-postası gönderildi.`
          : result.failed > 0
            ? "Eksik sipariş bulundu ancak e-posta gönderilemedi."
            : "Gönderilmemiş sipariş onay e-postası bulunamadı.",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Eksik sipariş e-postaları gönderilemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
