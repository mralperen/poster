import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

type CacheEntry = { value: string; expires: number };

const g = globalThis as typeof globalThis & {
  __posterTextCache?: Map<string, CacheEntry>;
  __posterMediaUrls?: Map<string, string>;
};

function textCache(): Map<string, CacheEntry> {
  if (!g.__posterTextCache) g.__posterTextCache = new Map();
  return g.__posterTextCache;
}

function mediaUrlCache(): Map<string, string> {
  if (!g.__posterMediaUrls) g.__posterMediaUrls = new Map();
  return g.__posterMediaUrls;
}

const TEXT_CACHE_TTL_MS = 60_000;

function useBlobStorage(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return true;
  if (process.env.VERCEL && process.env.BLOB_STORE_ID?.trim()) return true;
  return false;
}

function requireBlobOnVercel(): void {
  if (process.env.VERCEL && !useBlobStorage()) {
    throw new Error(
      "Vercel Blob henüz aktif değil. Dashboard → Storage → Blob'u bu projeye bağlayın, sonra terminalde vercel --prod çalıştırın.",
    );
  }
}

function isUploadPath(relativePath: string): boolean {
  return relativePath.replace(/^\//, "").startsWith("uploads/");
}

function blobPutOptions(contentType: string, access: "public" | "private") {
  return {
    access,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
    cacheControlMaxAge: 60 * 60 * 24 * 30,
  };
}

function resolveLocalPath(relativePath: string): string {
  return path.join(process.cwd(), relativePath.replace(/^\//, ""));
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  return Buffer.from(await new Response(stream).arrayBuffer());
}

async function readLocalText(relativePath: string): Promise<string | null> {
  try {
    return await readFile(resolveLocalPath(relativePath), "utf-8");
  } catch {
    return null;
  }
}

async function readLocalBinary(relativePath: string): Promise<Buffer | null> {
  try {
    return await readFile(resolveLocalPath(relativePath));
  } catch {
    return null;
  }
}

async function readBlobBytes(relativePath: string): Promise<Buffer | null> {
  try {
    const { get } = await import("@vercel/blob");
    const key = relativePath.replace(/^\//, "");
    const result = await get(key, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return streamToBuffer(result.stream);
  } catch {
    return null;
  }
}

async function readBlobText(relativePath: string): Promise<string | null> {
  const bytes = await readBlobBytes(relativePath);
  return bytes ? bytes.toString("utf-8") : null;
}

function invalidateTextCache(relativePath?: string): void {
  const cache = textCache();
  if (!relativePath) {
    cache.clear();
    return;
  }
  cache.delete(relativePath.replace(/^\//, ""));
}

export function getCachedMediaUrl(relativePath: string): string | undefined {
  return mediaUrlCache().get(relativePath.replace(/^\//, ""));
}

export function rememberMediaUrl(relativePath: string, url: string): void {
  mediaUrlCache().set(relativePath.replace(/^\//, ""), url);
}

/**
 * JSON / metin oku.
 * Sıra: bellek cache → lokal git kopyası → Blob (sadece cache miss).
 * Böylece her sayfa açılışında Blob Simple Operation yakılmaz.
 */
export async function readTextFile(relativePath: string): Promise<string | null> {
  const normalized = relativePath.replace(/^\//, "");
  const cache = textCache();
  const cached = cache.get(normalized);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }

  const local = await readLocalText(normalized);

  if (useBlobStorage()) {
    try {
      const fromBlob = await readBlobText(normalized);
      if (fromBlob !== null) {
        cache.set(normalized, {
          value: fromBlob,
          expires: Date.now() + TEXT_CACHE_TTL_MS,
        });
        return fromBlob;
      }
    } catch {
      /* kota / ağ hatası → lokal yedek */
    }
  }

  if (local !== null) {
    cache.set(normalized, {
      value: local,
      expires: Date.now() + TEXT_CACHE_TTL_MS,
    });
    return local;
  }

  return null;
}

export async function writeTextFile(
  relativePath: string,
  content: string,
): Promise<void> {
  const normalized = relativePath.replace(/^\//, "");

  requireBlobOnVercel();

  textCache().set(normalized, {
    value: content,
    expires: Date.now() + TEXT_CACHE_TTL_MS,
  });

  if (useBlobStorage()) {
    const { put } = await import("@vercel/blob");
    await put(
      normalized,
      content,
      blobPutOptions(
        normalized.endsWith(".json")
          ? "application/json"
          : "text/plain;charset=utf-8",
        "private",
      ),
    );
    return;
  }

  const filePath = resolveLocalPath(normalized);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf-8");
}

export async function readBinaryFile(relativePath: string): Promise<Buffer | null> {
  const normalized = relativePath.replace(/^\//, "");

  const local = await readLocalBinary(normalized);
  if (local) return local;

  if (useBlobStorage()) {
    return readBlobBytes(normalized);
  }

  return null;
}

/**
 * Medya (uploads/) public yazılır → CDN'den servis, her görüntü private get() yakmaz.
 * JSON vb. private kalır.
 */
export async function writeBinaryFile(
  relativePath: string,
  buffer: Buffer,
  contentType: string,
): Promise<string | void> {
  const normalized = relativePath.replace(/^\//, "");

  requireBlobOnVercel();

  if (useBlobStorage()) {
    const { put } = await import("@vercel/blob");
    const access = isUploadPath(normalized) ? "public" : "private";

    try {
      const result = await put(
        normalized,
        buffer,
        blobPutOptions(contentType, access),
      );
      if (result.url) {
        rememberMediaUrl(normalized, result.url);
        return result.url;
      }
    } catch {
      // Store private-only ise public put fail olabilir → private fallback
      if (access === "public") {
        const result = await put(
          normalized,
          buffer,
          blobPutOptions(contentType, "private"),
        );
        if (result.url) rememberMediaUrl(normalized, result.url);
        return result.url;
      }
      throw new Error("Blob yazılamadı.");
    }
    return;
  }

  const filePath = resolveLocalPath(normalized);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
}

export async function fileExists(relativePath: string): Promise<boolean> {
  const normalized = relativePath.replace(/^\//, "");

  if (getCachedMediaUrl(normalized)) return true;

  try {
    await access(resolveLocalPath(normalized));
    return true;
  } catch {
    /* continue */
  }

  // head() Simple Operation yakar — kotayı korumak için Blob head kullanma
  return false;
}

export async function deletePath(relativePath: string): Promise<void> {
  const normalized = relativePath.replace(/^\//, "");

  if (useBlobStorage()) {
    try {
      const { del, list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: normalized });
      if (blobs.length === 0) return;
      await Promise.all(blobs.map((blob) => del(blob.url)));
      for (const blob of blobs) {
        mediaUrlCache().delete(blob.pathname.replace(/^\//, ""));
      }
    } catch {
      /* missing/empty prefix is fine */
    }
    return;
  }

  await rm(resolveLocalPath(normalized), { recursive: true, force: true });
}

export function isRemoteStorage(): boolean {
  return useBlobStorage();
}

export { invalidateTextCache };
