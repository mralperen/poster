import { getProductById } from "@/lib/db/products-store";
import {
  getUnitPrice,
  normalizeFrameOption,
} from "@/lib/pricing";
import type { CartItem, FrameOption } from "@/lib/types";

export type CheckoutLineInput = {
  productId: string;
  quantity: number;
  frameOption?: FrameOption;
};

export class CheckoutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutValidationError";
  }
}

const MAX_LINES = 30;
const MAX_QUANTITY_PER_LINE = 20;

export async function resolveCheckoutCart(
  lines: CheckoutLineInput[],
): Promise<CartItem[]> {
  if (!lines.length) {
    throw new CheckoutValidationError("Sepet boş.");
  }

  if (lines.length > MAX_LINES) {
    throw new CheckoutValidationError("Sepet çok büyük.");
  }

  const items: CartItem[] = [];

  for (const line of lines) {
    const productId = line.productId?.trim();
    const quantity = Math.floor(Number(line.quantity));
    const frameOption = normalizeFrameOption(line.frameOption);

    if (!productId || !Number.isFinite(quantity) || quantity < 1) {
      throw new CheckoutValidationError("Geçersiz sepet satırı.");
    }

    if (quantity > MAX_QUANTITY_PER_LINE) {
      throw new CheckoutValidationError(
        "Bir üründen en fazla 20 adet alınabilir.",
      );
    }

    const product = await getProductById(productId);
    if (!product || product.published === false) {
      throw new CheckoutValidationError("Sepette geçersiz ürün var.");
    }

    if (!Number.isFinite(product.basePrice) || product.basePrice <= 0) {
      throw new CheckoutValidationError("Ürün fiyatı geçersiz.");
    }

    items.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      quantity,
      unitPrice: getUnitPrice(product.basePrice, frameOption),
      thumbnail: product.thumbnail,
      frameOption,
    });
  }

  return items;
}
