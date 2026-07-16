import sharp from "sharp";

export const POSTER_WIDTH = 900;
export const POSTER_HEIGHT = 1200;

export async function processPosterImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(POSTER_WIDTH, POSTER_HEIGHT, {
      fit: "cover",
      position: "centre",
    })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}
