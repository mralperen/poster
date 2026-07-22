import path from "node:path";
import { NextResponse } from "next/server";
import {
  getCachedMediaUrl,
  readBinaryFile,
} from "@/lib/db/storage";

type RouteContext = { params: Promise<{ path: string[] }> };

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

// CDN'nin yanıtı cache'lemesine izin ver — her istekte Function+Blob yakılmaz
export const revalidate = 86400;

export async function GET(_request: Request, context: RouteContext) {
  const { path: segments } = await context.params;
  const relativePath = path.posix.join("uploads", ...segments);

  if (relativePath.includes("..")) {
    return NextResponse.json({ error: "Geçersiz dosya yolu." }, { status: 400 });
  }

  const publicUrl = getCachedMediaUrl(relativePath);
  if (publicUrl) {
    return NextResponse.redirect(publicUrl, 308);
  }

  const buffer = await readBinaryFile(relativePath);
  if (!buffer) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  }

  const ext = path.extname(relativePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Cache-Control": "public, s-maxage=31536000, max-age=31536000, immutable",
      "Content-Length": String(buffer.byteLength),
      "Content-Type": contentType,
    },
  });
}
