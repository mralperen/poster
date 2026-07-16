import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  getProductById,
  registerProductVideoPath,
  saveProductVideo,
} from "@/lib/db/products-store";
import { isRemoteStorage } from "@/lib/db/storage";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_BYTES = 80 * 1024 * 1024;

export const maxDuration = 60;

function extensionFromPathname(pathname: string): "mp4" | "webm" | null {
  const lower = pathname.toLowerCase();
  if (lower.endsWith(".webm")) return "webm";
  if (lower.endsWith(".mp4")) return "mp4";
  return null;
}

function publicPathFromUploadPathname(pathname: string): string {
  const clean = pathname.replace(/^\//, "");
  return clean.startsWith("uploads/") ? `/${clean}` : `/uploads/${clean}`;
}

export async function POST(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id } = await context.params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;

      if (body.type === "register" && typeof body.pathname === "string") {
        const extension = extensionFromPathname(body.pathname);
        if (!extension) {
          return NextResponse.json(
            { error: "Sadece MP4 veya WebM kabul edilir." },
            { status: 400 },
          );
        }

        const expectedPrefix = `uploads/${id}/video.`;
        const clean = body.pathname.replace(/^\//, "");
        if (!clean.startsWith(expectedPrefix)) {
          return NextResponse.json({ error: "Geçersiz video yolu." }, { status: 400 });
        }

        const publicPath = await registerProductVideoPath(
          id,
          publicPathFromUploadPathname(clean),
        );

        revalidatePath(`/product/${product.slug}`);
        revalidatePath(`/admin/products/${id}/edit`);
        revalidatePath("/admin/products");

        return NextResponse.json({
          ok: true,
          path: publicPath,
          message: "Ürün videosu kaydedildi.",
        });
      }

      if (!isRemoteStorage()) {
        return NextResponse.json(
          {
            error:
              "Blob depolama aktif değil. Vercel Storage → Blob bağlayın veya küçük dosya için doğrudan yüklemeyi deneyin.",
          },
          { status: 400 },
        );
      }

      const jsonResponse = await handleUpload({
        body: body as unknown as HandleUploadBody,
        request,
        onBeforeGenerateToken: async (pathname) => {
          const clean = pathname.replace(/^\//, "");
          const expectedPrefix = `uploads/${id}/video.`;
          if (!clean.startsWith(expectedPrefix)) {
            throw new Error("Geçersiz video yolu.");
          }
          if (!extensionFromPathname(clean)) {
            throw new Error("Sadece MP4 veya WebM yükleyebilirsiniz.");
          }

          return {
            allowedContentTypes: ["video/mp4", "video/webm"],
            maximumSizeInBytes: MAX_BYTES,
            addRandomSuffix: false,
            allowOverwrite: true,
            tokenPayload: JSON.stringify({ productId: id }),
          };
        },
        onUploadCompleted: async ({ blob }) => {
          const clean = blob.pathname.replace(/^\//, "");
          await registerProductVideoPath(id, publicPathFromUploadPathname(clean));
          revalidatePath(`/product/${product.slug}`);
          revalidatePath(`/admin/products/${id}/edit`);
        },
      });

      return NextResponse.json(jsonResponse);
    }

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
    revalidatePath("/admin/products");

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
