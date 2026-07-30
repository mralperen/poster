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

/** Müşteri yorum fotoğrafları — boyut düşür, EXIF yönünü düzelt */
export async function processReviewImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(1600, 1600, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}
