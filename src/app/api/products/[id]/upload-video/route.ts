import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  getProductById,
  registerProductVideoPath,
  saveProductVideo,
} from "@/lib/db/products-store";
import { isRemoteStorage, rememberMediaUrl } from "@/lib/db/storage";
import {
  extensionFromPathname,
  isProductVideoPath,
  publicPathFromUploadPathname,
  videoExtensionFromFile,
} from "@/lib/video-upload";
import { verifyUploadBlobExists } from "@/lib/video-upload-server";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_BYTES = 80 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/mp4",
];

export const maxDuration = 60;

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;

      if (body.type === "presign" && typeof body.pathname === "string") {
        if (!(await isAdminAuthenticated())) {
          return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
        }

        if (!isRemoteStorage()) {
          return NextResponse.json(
            {
              error:
                "Blob depolama aktif değil. Vercel Storage → Blob bağlayın.",
            },
            { status: 400 },
          );
        }

        const clean = body.pathname.replace(/^\//, "");
        if (!isProductVideoPath(clean, id)) {
          return NextResponse.json({ error: "Geçersiz video yolu." }, { status: 400 });
        }
        if (!extensionFromPathname(clean)) {
          return NextResponse.json(
            { error: "Sadece MP4 veya WebM kabul edilir." },
            { status: 400 },
          );
        }

        // OIDC ile imzalı URL — handleUpload'ın istediği BLOB_READ_WRITE_TOKEN gerekmez.
        const token = await issueSignedToken({
          pathname: clean,
          operations: ["put"],
          allowedContentTypes: ALLOWED_VIDEO_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          validUntil: Date.now() + 60 * 60 * 1000,
        });

        const { presignedUrl } = await presignUrl(token, {
          operation: "put",
          pathname: clean,
          access: "private",
          allowedContentTypes: ALLOWED_VIDEO_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
          validUntil: Date.now() + 30 * 60 * 1000,
        });

        return NextResponse.json({
          ok: true,
          pathname: clean,
          presignedUrl,
        });
      }

      if (body.type === "register" && typeof body.pathname === "string") {
        if (!(await isAdminAuthenticated())) {
          return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
        }

        const extension = extensionFromPathname(body.pathname);
        if (!extension) {
          return NextResponse.json(
            { error: "Sadece MP4 veya WebM kabul edilir." },
            { status: 400 },
          );
        }

        const clean = body.pathname.replace(/^\//, "");
        if (!isProductVideoPath(clean, id)) {
          return NextResponse.json({ error: "Geçersiz video yolu." }, { status: 400 });
        }

        if (!(await verifyUploadBlobExists(clean))) {
          return NextResponse.json(
            {
              error:
                "Video Blob'da bulunamadı. Yükleme tamamlanmadan kaydedilmiş olabilir; tekrar deneyin.",
            },
            { status: 404 },
          );
        }

        if (
          typeof body.url === "string" &&
          body.url.startsWith("http") &&
          !body.url.includes(".private.blob.vercel-storage.com")
        ) {
          rememberMediaUrl(clean, body.url);
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

      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
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

    const extension = videoExtensionFromFile(file);

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
    const status = message === "Yetkisiz." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
