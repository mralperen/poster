/**
 * Canlı Blob'daki satış verisini boşaltır.
 * Kullanım: BLOB_READ_WRITE_TOKEN=... node scripts/clear-sales.mjs
 */
import { put } from "@vercel/blob";

async function clearFile(key) {
  await put(key, "[]\n", {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  console.log(`cleared ${key}`);
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    console.error("BLOB_READ_WRITE_TOKEN tanımlı değil.");
    process.exit(1);
  }

  await clearFile("data/orders.json");
  await clearFile("data/paytr-callbacks.json");
  await clearFile("data/admin-notifications.json");
  await clearFile("data/shopier-webhooks.json");
  console.log("Satış verileri temizlendi.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
