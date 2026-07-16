import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

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

function blobPutOptions(contentType: string) {
  return {
    access: "private" as const,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  };
}

function resolveLocalPath(relativePath: string): string {
  return path.join(process.cwd(), relativePath.replace(/^\//, ""));
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  return Buffer.from(await new Response(stream).arrayBuffer());
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

export async function readTextFile(relativePath: string): Promise<string | null> {
  const normalized = relativePath.replace(/^\//, "");

  if (useBlobStorage()) {
    return readBlobText(normalized);
  }

  if (process.env.VERCEL) {
    return null;
  }

  try {
    return await readFile(resolveLocalPath(normalized), "utf-8");
  } catch {
    return null;
  }
}

export async function writeTextFile(
  relativePath: string,
  content: string,
): Promise<void> {
  const normalized = relativePath.replace(/^\//, "");

  requireBlobOnVercel();

  if (useBlobStorage()) {
    const { put } = await import("@vercel/blob");
    await put(
      normalized,
      content,
      blobPutOptions(
        normalized.endsWith(".json")
          ? "application/json"
          : "text/plain;charset=utf-8",
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

  if (useBlobStorage()) {
    return readBlobBytes(normalized);
  }

  if (process.env.VERCEL) {
    return null;
  }

  try {
    return await readFile(resolveLocalPath(normalized));
  } catch {
    return null;
  }
}

export async function writeBinaryFile(
  relativePath: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const normalized = relativePath.replace(/^\//, "");

  requireBlobOnVercel();

  if (useBlobStorage()) {
    const { put } = await import("@vercel/blob");
    await put(normalized, buffer, blobPutOptions(contentType));
    return;
  }

  const filePath = resolveLocalPath(normalized);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
}

export async function fileExists(relativePath: string): Promise<boolean> {
  const normalized = relativePath.replace(/^\//, "");

  if (useBlobStorage()) {
    try {
      const { head } = await import("@vercel/blob");
      await head(normalized);
      return true;
    } catch {
      return false;
    }
  }

  if (process.env.VERCEL) {
    return false;
  }

  try {
    await access(resolveLocalPath(normalized));
    return true;
  } catch {
    return false;
  }
}

export async function deletePath(relativePath: string): Promise<void> {
  const normalized = relativePath.replace(/^\//, "");

  if (useBlobStorage()) {
    const { del, list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: normalized });
    await Promise.all(blobs.map((blob) => del(blob.url)));
    return;
  }

  await rm(resolveLocalPath(normalized), { recursive: true, force: true });
}

export function isRemoteStorage(): boolean {
  return useBlobStorage();
}
