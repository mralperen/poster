import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const WIDTH = 900;
const HEIGHT = 1200;

const IMAGES = {
  wave:
    "https://upload.wikimedia.org/wikipedia/commons/0/0a/The_Great_Wave_off_Kanagawa.jpg",
  starry:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
  waterlilies:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/1280px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg",
};

const PRODUCTS = [
  { dir: "dalga-yildiz", files: { left: "wave", right: "starry" } },
  {
    dir: "klasik-uclu",
    files: { left: "wave", center: "waterlilies", right: "starry" },
  },
  { dir: "monet-gece", files: { left: "waterlilies", right: "starry" } },
  { dir: "japon-uclu", files: { left: "wave", center: "redFuji", right: "gate" } },
];

const OUT_ROOT = path.join(process.cwd(), "public", "products");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadBuffer(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "prism-poster-generator/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Download failed ${response.status}: ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function preparePoster(buffer) {
  return sharp(buffer)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
    .jpeg({ quality: 88 })
    .toBuffer();
}

async function createRedFuji(waveBuffer) {
  const overlay = await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 200, g: 60, b: 30, alpha: 0.45 },
    },
  })
    .png()
    .toBuffer();

  return sharp(waveBuffer)
    .modulate({ brightness: 1.1, saturation: 1.4, hue: 40 })
    .composite([{ input: overlay, blend: "overlay" }])
    .jpeg({ quality: 88 })
    .toBuffer();
}

async function createGate(starryBuffer) {
  return sharp(starryBuffer)
    .modulate({ brightness: 0.85, saturation: 0.7, hue: -20 })
    .tint({ r: 180, g: 140, b: 90 })
    .jpeg({ quality: 88 })
    .toBuffer();
}

async function main() {
  await fs.rm(OUT_ROOT, { recursive: true, force: true });
  await fs.mkdir(OUT_ROOT, { recursive: true });

  const cache = {};

  for (const key of Object.keys(IMAGES)) {
    console.log(`Downloading ${key}...`);
    cache[key] = await preparePoster(await downloadBuffer(IMAGES[key]));
    await sleep(1500);
  }

  cache.redFuji = await createRedFuji(cache.wave);
  cache.gate = await createGate(cache.starry);
  console.log("Generated derived images: redFuji, gate");

  for (const product of PRODUCTS) {
    const dir = path.join(OUT_ROOT, product.dir);
    await fs.mkdir(dir, { recursive: true });

    for (const [filename, imageKey] of Object.entries(product.files)) {
      await fs.writeFile(path.join(dir, `${filename}.jpg`), cache[imageKey]);
      console.log(`  ${product.dir}/${filename}.jpg`);
    }
  }

  console.log("\nAll product images ready in public/products/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
