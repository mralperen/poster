import crypto from "node:crypto";
import type { StoredOrder } from "@/lib/db/orders-store";
import type { CartItem } from "@/lib/types";

const PAYTR_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";

export class PaytrConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaytrConfigError";
  }
}

type PaytrConfig = {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  testMode: 0 | 1;
};

export function isPaytrConfigured(): boolean {
  return Boolean(
    process.env.PAYTR_MERCHANT_ID?.trim() &&
      process.env.PAYTR_MERCHANT_KEY?.trim() &&
      process.env.PAYTR_MERCHANT_SALT?.trim(),
  );
}

function getPaytrConfig(): PaytrConfig {
  const merchantId = process.env.PAYTR_MERCHANT_ID?.trim();
  const merchantKey = process.env.PAYTR_MERCHANT_KEY?.trim();
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT?.trim();

  if (!merchantId || !merchantKey || !merchantSalt) {
    throw new PaytrConfigError(
      "PayTR yapılandırması eksik. PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY ve PAYTR_MERCHANT_SALT tanımlayın.",
    );
  }

  return {
    merchantId,
    merchantKey,
    merchantSalt,
    testMode: process.env.PAYTR_TEST_MODE === "1" ? 1 : 0,
  };
}

export function getSiteBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!url || url.includes("example.com")) {
    return "http://localhost:3000";
  }
  return url.replace(/\/$/, "");
}

export function toPaytrMerchantOid(orderId: string): string {
  return orderId.replace(/-/g, "");
}

function signToken(hashStr: string, merchantKey: string, merchantSalt: string): string {
  return crypto
    .createHmac("sha256", merchantKey)
    .update(`${hashStr}${merchantSalt}`)
    .digest("base64");
}

export function buildPaytrBasket(items: CartItem[]): string {
  const basket = items.map((item) => {
    const frameLabel =
      item.frameOption === "frameless" ? "Çerçevesiz" : "Çerçeveli";
    const title = `${item.name} (${frameLabel})`.slice(0, 120);
    return [title, item.unitPrice.toFixed(2), item.quantity];
  });
  return Buffer.from(JSON.stringify(basket)).toString("base64");
}

export function verifyPaytrCallbackHash(input: {
  merchantOid: string;
  status: string;
  totalAmount: string;
  hash: string;
}): boolean {
  const { merchantKey, merchantSalt } = getPaytrConfig();
  const payload = `${input.merchantOid}${merchantSalt}${input.status}${input.totalAmount}`;
  const expected = crypto
    .createHmac("sha256", merchantKey)
    .update(payload)
    .digest("base64");
  return expected === input.hash;
}

export type PaytrIframeTokenResult =
  | { ok: true; token: string }
  | { ok: false; reason: string };

export async function createPaytrIframeToken(input: {
  order: StoredOrder;
  userIp: string;
}): Promise<PaytrIframeTokenResult> {
  const { merchantId, merchantKey, merchantSalt, testMode } = getPaytrConfig();
  const { order, userIp } = input;
  const siteUrl = getSiteBaseUrl();
  const merchantOid = order.paytrMerchantOid;
  const paymentAmount = Math.round(order.totals.total * 100);
  const userBasket = buildPaytrBasket(order.items);
  const noInstallment = 0;
  const maxInstallment = 0;
  const currency = "TL";
  const email = order.customer.email;
  const hashStr = `${merchantId}${userIp}${merchantOid}${email}${paymentAmount}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}`;
  const paytrToken = signToken(hashStr, merchantKey, merchantSalt);

  const body = new URLSearchParams({
    merchant_id: merchantId,
    user_ip: userIp,
    merchant_oid: merchantOid,
    email,
    payment_amount: String(paymentAmount),
    paytr_token: paytrToken,
    user_basket: userBasket,
    no_installment: String(noInstallment),
    max_installment: String(maxInstallment),
    currency,
    test_mode: String(testMode),
    user_name: order.customer.name.slice(0, 60),
    user_address: order.customer.address.slice(0, 400),
    user_phone: order.customer.phone.slice(0, 20),
    merchant_ok_url: `${siteUrl}/checkout/success?order=${order.id}`,
    merchant_fail_url: `${siteUrl}/checkout/fail?order=${order.id}`,
    debug_on: process.env.NODE_ENV === "production" ? "0" : "1",
    timeout_limit: "30",
    lang: "tr",
  });

  const response = await fetch(PAYTR_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const raw = await response.text();
  let data: { status?: string; token?: string; reason?: string };
  try {
    data = JSON.parse(raw) as { status?: string; token?: string; reason?: string };
  } catch {
    return { ok: false, reason: raw || "PayTR token yanıtı okunamadı." };
  }

  if (data.status !== "success" || !data.token) {
    return {
      ok: false,
      reason: data.reason ?? "PayTR ödeme tokenı alınamadı.",
    };
  }

  return { ok: true, token: data.token };
}

export function resolveClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "127.0.0.1";
  }
  return request.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}