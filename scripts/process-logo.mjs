import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "headerlogo.png");
const OUT = path.join(ROOT, "public", "brand", "header-logo.png");

async function main() {
  try {
    await fs.access(SOURCE);
  } catch {
    console.error("headerlogo.png bulunamadı — proje köküne koyun.");
    process.exit(1);
  }

  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;

    if (luma < 18) {
      data[i + 3] = 0;
    } else if (luma < 42) {
      data[i + 3] = Math.round(((luma - 18) / 24) * data[i + 3]);
    }
  }

  const buffer = await sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();

  await sharp(buffer).trim().png().toFile(OUT);

  const meta = await sharp(OUT).metadata();
  console.log(`Logo işlendi: ${meta.width}x${meta.height} (alpha: ${meta.hasAlpha})`);
}

main();
