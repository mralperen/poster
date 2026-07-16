export type PosterSize = "A3" | "A2" | "A1";

/** Standart: çerçeveli. Çerçevesiz: basePrice − FRAMELESS_DISCOUNT */
export type FrameOption = "framed" | "frameless";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  badge?: string;
  viewCount: 2 | 3;
  views: string[];
  viewLabels: string[];
  thumbnail: string;
  /** `/uploads/{id}/video.mp4` veya webm */
  video?: string;
  basePrice: number;
  sizes: PosterSize[];
  sizePrices: Record<PosterSize, number>;
  featured?: boolean;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  quantity: number;
  unitPrice: number;
  thumbnail: string;
  frameOption?: FrameOption;
};
