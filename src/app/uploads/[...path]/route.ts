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

function parseByteRange(
  value: string,
  totalSize: number,
): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(value.trim());
  if (!match) return null;

  const startRaw = match[1];
  const endRaw = match[2];

  if (!startRaw && !endRaw) return null;

  if (!startRaw) {
    const suffixLength = Number(endRaw);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) return null;
    return {
      start: Math.max(0, totalSize - suffixLength),
      end: totalSize - 1,
    };
  }

  const start = Number(startRaw);
  const end = endRaw ? Math.min(Number(endRaw), totalSize - 1) : totalSize - 1;
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start ||
    start >= totalSize
  ) {
    return null;
  }

  return { start, end };
}

async function streamVideo(
  request: Request,
  relativePath: string,
  contentType: string,
): Promise<Response | null> {
  try {
    const { get } = await import("@vercel/blob");
    const rangeHeader = request.headers.get("range");
    const result = await get(relativePath, {
      access: "private",
      ...(rangeHeader ? { headers: { Range: rangeHeader } } : {}),
    });

    if (!result?.stream) return null;

    const totalSize = result.blob.size;
    const range = rangeHeader ? parseByteRange(rangeHeader, totalSize) : null;

    if (rangeHeader && !range) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${totalSize}` },
      });
    }

    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, s-maxage=31536000, max-age=31536000, immutable",
      "Content-Type": result.blob.contentType || contentType,
    });

    if (range) {
      headers.set("Content-Range", `bytes ${range.start}-${range.end}/${totalSize}`);
      headers.set("Content-Length", String(range.end - range.start + 1));
    } else {
      headers.set("Content-Length", String(totalSize));
    }

    return new Response(result.stream, {
      status: range ? 206 : 200,
      headers,
    });
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
