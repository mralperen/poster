import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const FRAME_COUNT = 36;
const WIDTH = 900;
const HEIGHT = 1200;

const SOURCES = [
  {
    name: "view-a",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0a/The_Great_Wave_off_Kanagawa.jpg",
  },
  {
    name: "view-b",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
  },
];

const OUT_DIR = path.join(process.cwd(), "public", "demo-poster");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadBuffer(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "poster-demo-generator/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function preparePoster(buffer) {
  return sharp(buffer)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
    .jpeg({ quality: 90 })
    .toBuffer();
}

async function blendFrames(viewA, viewB) {
  const rawA = await sharp(viewA).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rawB = await sharp(viewB).removeAlpha().raw().toBuffer({ resolveWithObject: true });

  const framesDir = path.join(OUT_DIR, "frames");
  await fs.mkdir(framesDir, { recursive: true });

  console.log(`Generating ${FRAME_COUNT} lenticular frames...`);

  for (let i = 0; i < FRAME_COUNT; i++) {
    const t = i / (FRAME_COUNT - 1);
    const blended = Buffer.alloc(rawA.data.length);

    for (let px = 0; px < rawA.data.length; px++) {
      blended[px] = Math.round(rawA.data[px] * (1 - t) + rawB.data[px] * t);
    }

    const frame = await sharp(blended, {
      raw: { width: WIDTH, height: HEIGHT, channels: 3 },
    })
      .jpeg({ quality: 85 })
      .toBuffer();

    const name = String(i + 1).padStart(2, "0");
    await fs.writeFile(path.join(framesDir, `${name}.jpg`), frame);
    process.stdout.write(`\r  Frame ${name}/${FRAME_COUNT}`);
  }

  console.log("");
}

async function main() {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  const views = [];

  for (const source of SOURCES) {
    console.log(`Downloading ${source.name}...`);
    const raw = await downloadBuffer(source.url);
    const poster = await preparePoster(raw);
    await fs.writeFile(path.join(OUT_DIR, `${source.name}.jpg`), poster);
    views.push(poster);
    await sleep(1500);
  }

  await blendFrames(views[0], views[1]);
  console.log("Done! Demo assets saved to public/demo-poster/");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
