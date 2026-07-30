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

async function streamVideo(
  request: Request,
  relativePath: string,
  contentType: string,
): Promise<Response | null> {
  try {
    const { get } = await import("@vercel/blob");
    const rangeHeader = request.headers.get("range");

    for (const access of ["public", "private"] as const) {
      try {
        const result = await get(relativePath, {
          access,
          useCache: false,
          ...(rangeHeader ? { headers: { Range: rangeHeader } } : {}),
        });

        if (!result?.stream) continue;

        const upstreamContentRange = result.headers.get("content-range");
        const upstreamContentLength = result.headers.get("content-length");

        const headers = new Headers({
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, s-maxage=31536000, max-age=31536000, immutable",
          "Content-Type": result.blob.contentType || contentType,
          "Content-Length": upstreamContentLength ?? String(result.blob.size),
        });

        if (upstreamContentRange) {
          headers.set("Content-Range", upstreamContentRange);
        }

        return new Response(result.stream, {
          status: upstreamContentRange ? 206 : 200,
          headers,
        });
      } catch {
        /* try other access mode */
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request, context: RouteContext) {
  const { path: segments } = await context.params;
  const relativePath = path.posix.join("uploads", ...segments);

  if (relativePath.includes("..")) {
    return NextResponse.json({ error: "Geçersiz dosya yolu." }, { status: 400 });
  }

  const publicUrl = getCachedMediaUrl(relativePath);
  if (publicUrl) {
    return NextResponse.redirect(publicUrl, 308);
  }

  const ext = path.extname(relativePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

  if (ext === ".mp4" || ext === ".webm") {
    const response = await streamVideo(request, relativePath, contentType);
    if (response) return response;
  }

  const buffer = await readBinaryFile(relativePath);
  if (!buffer) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Cache-Control": "public, s-maxage=31536000, max-age=31536000, immutable",
      "Content-Length": String(buffer.byteLength),
      "Content-Type": contentType,
    },
  });
}
