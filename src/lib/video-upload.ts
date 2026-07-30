import { getCachedMediaUrl, isRemoteStorage } from "@/lib/db/storage";

export function videoExtensionFromFile(file: File): "mp4" | "webm" | null {
  if (file.type === "video/webm") return "webm";
  if (
    file.type === "video/mp4" ||
    file.type === "video/quicktime" ||
    file.type === "application/mp4"
  ) {
    return "mp4";
  }

  const name = file.name.toLowerCase();
  if (name.endsWith(".webm")) return "webm";
  if (name.endsWith(".mp4")) return "mp4";
  return null;
}

export function extensionFromPathname(pathname: string): "mp4" | "webm" | null {
  const lower = pathname.toLowerCase();
  if (lower.endsWith(".webm")) return "webm";
  if (lower.endsWith(".mp4")) return "mp4";
  return null;
}

export function publicPathFromUploadPathname(pathname: string): string {
  const clean = pathname.replace(/^\//, "");
  return clean.startsWith("uploads/") ? `/${clean}` : `/uploads/${clean}`;
}

/** uploads/{id}/video.mp4, video-1730.mp4, video-1730-abc.mp4 vb. */
export function isProductVideoPath(pathname: string, productId: string): boolean {
  const clean = pathname.replace(/^\//, "");
  const prefix = `uploads/${productId}/`;
  if (!clean.startsWith(prefix)) return false;

  const filename = clean.slice(prefix.length);
  return /^video(?:[-a-zA-Z0-9_.]+)?\.(?:mp4|webm)$/i.test(filename);
}

export async function verifyUploadBlobExists(pathname: string): Promise<boolean> {
  const clean = pathname.replace(/^\//, "");
  if (getCachedMediaUrl(clean)) return true;
  if (!isRemoteStorage()) return true;

  try {
    const { get } = await import("@vercel/blob");
    for (const access of ["public", "private"] as const) {
      try {
        const result = await get(clean, { access, useCache: false });
        if (result?.stream) return true;
      } catch {
        /* try other access */
      }
    }
  } catch {
    /* not found */
  }
  return false;
}
