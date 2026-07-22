import fs from "node:fs/promises";
import path from "node:path";
import { put, list } from "@vercel/blob";

const ROOT = process.cwd();

async function blobExists(key: string): Promise<boolean> {
  const { blobs } = await list({ prefix: key, limit: 5 });
  return blobs.some(
    (blob) => blob.pathname === key || blob.pathname.endsWith(`/${key}`),
  );
}

async function uploadFile(relativePath: string, contentType: string, force = false) {
  const key = relativePath.replace(/^\//, "").replace(/\\/g, "/");
  if (!force && (await blobExists(key))) {
    console.log(`skip  ${key}`);
    return;
  }

  const absolute = path.join(ROOT, relativePath);
  const buffer = await fs.readFile(absolute);
  await put(key, buffer, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  });
  console.log(`${force ? "force " : "upload "} ${key}`);
}

async function walkUploads(dir: string, base = "public/uploads") {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    const relative = path.posix.join(base, entry.name);
    if (entry.isDirectory()) {
      await walkUploads(absolute, relative);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    const type =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";
    await uploadFile(relative.replace(/^public\//, ""), type);
  }
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    console.error("BLOB_READ_WRITE_TOKEN tanımlı değil.");
    console.error("Vercel Blob store bağlayın veya .env.local kullanın.");
    process.exit(1);
  }

  const force = process.argv.includes("--force");

  const jsonFiles = [
    "data/products.json",
    "data/site-content.json",
    "data/orders.json",
    "data/paytr-callbacks.json",
    "data/admin-totp.json",
    "data/product-reviews.json",
  ];

  for (const file of jsonFiles) {
    try {
      await uploadFile(file, "application/json", force);
    } catch (error) {
      console.warn(`warn  ${file}: ${error instanceof Error ? error.message : error}`);
    }
  }

  await walkUploads(path.join(ROOT, "public", "uploads"));
  console.log(force ? "Blob senkronizasyonu tamam (--force)." : "Blob senkronizasyonu tamam.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
