import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getProductById, saveProductVideo } from "@/lib/db/products-store";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_BYTES = 80 * 1024 * 1024;

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
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Geçersiz yükleme." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Video en fazla 80 MB olabilir." },
        { status: 400 },
      );
    }

    const extension =
      file.type === "video/webm"
        ? "webm"
        : file.type === "video/mp4"
          ? "mp4"
          : null;

    if (!extension) {
      return NextResponse.json(
        { error: "Sadece MP4 veya WebM yükleyebilirsiniz." },
        { status: 400 },
      );
    }

    const raw = Buffer.from(await file.arrayBuffer());
    const publicPath = await saveProductVideo(id, raw, extension);

    revalidatePath(`/product/${product.slug}`);
    revalidatePath(`/admin/products/${id}/edit`);

    return NextResponse.json({
      ok: true,
      path: publicPath,
      message: "Ürün videosu yüklendi.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yükleme başarısız.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
