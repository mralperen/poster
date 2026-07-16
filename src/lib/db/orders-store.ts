import { randomUUID } from "node:crypto";
import { readTextFile, writeTextFile } from "@/lib/db/storage";
import { toPaytrMerchantOid } from "@/lib/paytr";
import type { CartItem } from "@/lib/types";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "failed"
  | "fulfilled"
  | "refunded";

export type OrderCustomer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
};

export type StoredOrder = {
  id: string;
  status: OrderStatus;
  customer: OrderCustomer;
  items: CartItem[];
  totals: {
    rawSubtotal: number;
    discountTotal: number;
    subtotal: number;
    shipping: number;
    total: number;
    bundleDiscountRate: number;
  };
  paymentProvider: "paytr";
  paytrMerchantOid: string;
  paytrPaidAmount?: number;
  createdAt: string;
  updatedAt: string;
};

export type StoredPaytrCallback = {
  id: string;
  merchantOid: string;
  status: string;
  totalAmount: string;
  paymentType?: string;
  failedReason?: string;
  signatureVerified: boolean;
  receivedAt: string;
};

const ORDERS_FILE = "data/orders.json";
const CALLBACKS_FILE = "data/paytr-callbacks.json";

/** Ödeme yapılmayan siparişler bu süre sonunda otomatik iptal edilir. */
export const PENDING_ORDER_EXPIRY_MS = 30 * 60 * 1000;

export function isPendingOrderExpired(order: StoredOrder, now = Date.now()): boolean {
  if (order.status !== "pending_payment") return false;
  return now - new Date(order.createdAt).getTime() >= PENDING_ORDER_EXPIRY_MS;
}

async function readArray<T>(filePath: string): Promise<T[]> {
  const raw = await readTextFile(filePath);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function writeArray<T>(filePath: string, value: T[]): Promise<void> {
  await writeTextFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function readOrders(): Promise<StoredOrder[]> {
  return readArray<StoredOrder>(ORDERS_FILE);
}

async function writeOrders(orders: StoredOrder[]): Promise<void> {
  await writeArray(ORDERS_FILE, orders);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createOrder(
  input: Omit<
    StoredOrder,
    "id" | "status" | "paymentProvider" | "paytrMerchantOid" | "createdAt" | "updatedAt"
  >,
): Promise<StoredOrder> {
  const orders = await readArray<StoredOrder>(ORDERS_FILE);
  const now = new Date().toISOString();
  const id = randomUUID();
  const order: StoredOrder = {
    ...input,
    id,
    status: "pending_payment",
    paymentProvider: "paytr",
    paytrMerchantOid: toPaytrMerchantOid(id),
    createdAt: now,
    updatedAt: now,
  };
  orders.unshift(order);
  await writeArray(ORDERS_FILE, orders);
  return order;
}

export async function expireStalePendingOrders(): Promise<number> {
  const orders = await readOrders();
  const now = Date.now();
  let expiredCount = 0;
  let changed = false;

  for (let index = 0; index < orders.length; index++) {
    const order = orders[index];
    if (!isPendingOrderExpired(order, now)) continue;

    orders[index] = {
      ...order,
      status: "failed",
      updatedAt: new Date().toISOString(),
    };
    expiredCount += 1;
    changed = true;
  }

  if (changed) {
    await writeOrders(orders);
  }

  return expiredCount;
}

export async function expireOrderIfStale(order: StoredOrder): Promise<StoredOrder> {
  if (!isPendingOrderExpired(order)) return order;
  return (await updateOrderStatus(order.id, "failed")) ?? { ...order, status: "failed" };
}

export async function listOrders(): Promise<StoredOrder[]> {
  await expireStalePendingOrders();
  return readOrders();
}

export async function getOrderById(
  id: string,
  options?: { maxAttempts?: number; retryDelayMs?: number },
): Promise<StoredOrder | undefined> {
  const maxAttempts = Math.max(1, options?.maxAttempts ?? 1);
  const retryDelayMs = options?.retryDelayMs ?? 300;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const orders = await readArray<StoredOrder>(ORDERS_FILE);
    const order = orders.find((item) => item.id === id);
    if (order) {
      return expireOrderIfStale(order);
    }
    if (attempt < maxAttempts) {
      await delay(retryDelayMs);
    }
  }

  return undefined;
}

export async function getOrderByPaytrMerchantOid(
  merchantOid: string,
  options?: { maxAttempts?: number; retryDelayMs?: number },
): Promise<StoredOrder | undefined> {
  const maxAttempts = Math.max(1, options?.maxAttempts ?? 8);
  const retryDelayMs = options?.retryDelayMs ?? 450;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const orders = await readOrders();
    const order = orders.find((item) => item.paytrMerchantOid === merchantOid);
    if (order) return order;
    if (attempt < maxAttempts) {
      await delay(retryDelayMs);
    }
  }

  return undefined;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  patch: Partial<Pick<StoredOrder, "paytrPaidAmount">> = {},
): Promise<StoredOrder | undefined> {
  const maxAttempts = 6;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const orders = await readOrders();
    const index = orders.findIndex((order) => order.id === id);
    if (index === -1) return undefined;

    const current = orders[index];
    if (
      current.status === status &&
      (patch.paytrPaidAmount === undefined ||
        current.paytrPaidAmount === patch.paytrPaidAmount)
    ) {
      return current;
    }

    const updated: StoredOrder = {
      ...current,
      ...patch,
      status,
      updatedAt: new Date().toISOString(),
    };

    orders[index] = updated;
    await writeOrders(orders);

    const verified = await getOrderById(id, { maxAttempts: 4, retryDelayMs: 250 });
    if (verified?.status === status) {
      return verified;
    }

    if (attempt < maxAttempts) {
      await delay(200 * attempt);
    }
  }

  return undefined;
}

export async function reconcileOrderWithPaytrCallbacks(
  order: StoredOrder,
): Promise<StoredOrder> {
  if (order.status !== "pending_payment" && order.status !== "failed") return order;

  const callbacks = await listPaytrCallbacks();
  const successCallback = callbacks.find(
    (callback) =>
      callback.merchantOid === order.paytrMerchantOid &&
      callback.status === "success" &&
      callback.signatureVerified,
  );

  if (!successCallback) return order;

  const expectedAmount = Math.round(order.totals.total * 100);
  const paidAmount = Number(successCallback.totalAmount);
  if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount) {
    return order;
  }

  const updated = await updateOrderStatus(order.id, "paid", {
    paytrPaidAmount: paidAmount / 100,
  });

  return updated ?? order;
}

export async function recordPaytrCallback(
  callback: StoredPaytrCallback,
): Promise<StoredPaytrCallback> {
  const callbacks = await readArray<StoredPaytrCallback>(CALLBACKS_FILE);
  const existing = callbacks.find(
    (item) =>
      item.merchantOid === callback.merchantOid &&
      item.status === callback.status &&
      item.totalAmount === callback.totalAmount,
  );
  if (existing) return existing;

  callbacks.unshift(callback);
  await writeArray(CALLBACKS_FILE, callbacks.slice(0, 200));
  return callback;
}

export async function listPaytrCallbacks(): Promise<StoredPaytrCallback[]> {
  return readArray<StoredPaytrCallback>(CALLBACKS_FILE);
}
