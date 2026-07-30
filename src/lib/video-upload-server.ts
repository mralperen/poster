import { getCachedMediaUrl, isRemoteStorage, rememberMediaUrl } from "@/lib/db/storage";
import { isProductVideoPath } from "@/lib/video-upload";

export async function verifyUploadBlobExists(pathname: string): Promise<boolean> {
  const clean = pathname.replace(/^\//, "");
  if (getCachedMediaUrl(clean)) return true;
  if (!isRemoteStorage()) return true;

  try {
    const { get } = await import("@vercel/blob");
    for (const access of ["private", "public"] as const) {
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

/** Kayıt yolu 404 ise Blob'da kalan son video dosyasını bul. */
export async function findLatestProductVideoPath(
  productId: string,
): Promise<string | null> {
  if (!isRemoteStorage()) return null;

  try {
    const { list } = await import("@vercel/blob");
    const prefix = `uploads/${productId}/`;
    const { blobs } = await list({ prefix });
    const videos = blobs
      .filter((blob) => isProductVideoPath(blob.pathname, productId))
      .sort((a, b) => {
        const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return bTime - aTime;
      });

    const latest = videos[0];
    if (!latest) return null;

    const publicPath = latest.pathname.startsWith("/")
      ? latest.pathname
      : `/${latest.pathname}`;

    if (latest.url) {
      rememberMediaUrl(latest.pathname.replace(/^\//, ""), latest.url);
    }

    return publicPath;
  } catch {
    return null;
  }
}
