import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const faviconSource = path.join(root, "faviocn.png");
const headerLogoSource = path.join(root, "headerlogo.png");
const publicDir = path.join(root, "public");
const appDir = path.join(root, "src", "app");
const bg = { r: 9, g: 9, b: 10, alpha: 1 };

async function removeDarkBackground(input) {
  const { data, info } = await sharp(input)
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

  return sharp(data, { raw: { width, height, channels } })
    .trim()
    .png()
    .toBuffer();
}

async function buildOgImage() {
  const ogWidth = 1200;
  const ogHeight = 630;
  const maxLogoWidth = 920;
  const maxLogoHeight = 360;

  const transparentLogo = await removeDarkBackground(
    await readFile(headerLogoSource),
  );

  const logo = await sharp(transparentLogo)
    .resize(maxLogoWidth, maxLogoHeight, { fit: "inside" })
    .png()
    .toBuffer();

  const { width = maxLogoWidth, height = maxLogoHeight } =
    await sharp(logo).metadata();

  const logoLeft = Math.round((ogWidth - width) / 2);
  const logoTop = Math.round((ogHeight - height) / 2);

  await sharp({
    create: { width: ogWidth, height: ogHeight, channels: 4, background: bg },
  })
    .composite([{ input: logo, top: logoTop, left: logoLeft }])
    .jpeg({ quality: 92 })
    .toFile(path.join(publicDir, "og-image.jpg"));
}

async function main() {
  await mkdir(publicDir, { recursive: true });

  await buildOgImage();

  const sizes = [
    { name: "favicon.png", size: 512 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "favicon-16x16.png", size: 16 },
    { name: "apple-touch-icon.png", size: 180 },
  ];

  for (const item of sizes) {
    await sharp(faviconSource)
      .resize(item.size, item.size, { fit: "contain", background: bg })
      .png()
      .toFile(path.join(publicDir, item.name));
  }

  await sharp(faviconSource)
    .resize(512, 512, { fit: "contain", background: bg })
    .png()
    .toFile(path.join(appDir, "icon.png"));

  const favicon32 = await readFile(path.join(publicDir, "favicon-32x32.png"));
  await sharp(favicon32).toFile(path.join(publicDir, "favicon.ico"));

  console.log("SEO assets generated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
