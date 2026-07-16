import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getProductById, saveViewImage } from "@/lib/db/products-store";
import { processPosterImage } from "@/lib/image-process";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id } = await context.params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const slotRaw = formData.get("slot");
    const file = formData.get("file");

    if (typeof slotRaw !== "string" || !(file instanceof File)) {
      return NextResponse.json({ error: "Geçersiz yükleme." }, { status: 400 });
    }

    const slot = Number(slotRaw);
    if (!Number.isInteger(slot) || slot < 0 || slot >= product.viewCount) {
      return NextResponse.json({ error: "Geçersiz görünüm slotu." }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "Sadece JPG, PNG veya WebP yükleyebilirsiniz." },
        { status: 400 },
      );
    }

    const raw = Buffer.from(await file.arrayBuffer());
    const processed = await processPosterImage(raw);
    const publicPath = await saveViewImage(id, slot, processed);

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath(`/product/${product.slug}`);
    revalidatePath(`/admin/products/${id}/edit`);

    return NextResponse.json({
      ok: true,
      path: publicPath,
      slot,
      message:
        "Görsel işlendi — tüm açılar aynı boyuta getirildi (900×1200). Kaydırma kusursuz çalışacak.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yükleme başarısız.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
