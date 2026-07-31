import {
  hasSuccessfulOrderEmail,
  recordEmailLog,
  type EmailLogType,
} from "@/lib/db/email-log-store";
import type { StoredOrder } from "@/lib/db/orders-store";
import {
  renderAdminOrderNotificationEmail,
  renderCustomerOrderConfirmationEmail,
  renderCustomerOrderShippedEmail,
} from "@/lib/email-templates";
import {
  getResendFromEmail,
  getSupportReplyToEmail,
  isResendConfigured,
  sendResendEmail,
} from "@/lib/resend-client";

export function isOrderEmailConfigured(): boolean {
  return isResendConfigured();
}

function getAdminNotifyEmail(): string {
  return getSupportReplyToEmail();
}

async function sendAndLog(input: {
  type: EmailLogType;
  order: StoredOrder;
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const result = await sendResendEmail({
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  await recordEmailLog({
    type: input.type,
    orderId: input.order.id,
    to: input.to,
    subject: input.subject,
    html: input.html,
    status: result.ok ? "sent" : "failed",
    error: result.ok ? undefined : result.reason,
  });

  return result;
}

export async function sendOrderConfirmationEmail(
  order: StoredOrder,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const template = renderCustomerOrderConfirmationEmail(order);

  return sendAndLog({
    type: "order_confirmation",
    order,
    to: order.customer.email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendAdminOrderNotificationEmail(
  order: StoredOrder,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const template = renderAdminOrderNotificationEmail(order);

  return sendAndLog({
    type: "admin_order_notification",
    order,
    to: getAdminNotifyEmail(),
    subject: template.subject,
    html: template.html,
  });
}

export async function sendOrderShippedEmail(
  order: StoredOrder,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isOrderEmailConfigured()) {
    return { ok: false, reason: "RESEND_API_KEY tanımlı değil." };
  }

  const alreadySent = await hasSuccessfulOrderEmail(order.id, "order_shipped");
  if (alreadySent) {
    return { ok: true };
  }

  const template = renderCustomerOrderShippedEmail(order);

  return sendAndLog({
    type: "order_shipped",
    order,
    to: order.customer.email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendOrderPaidEmails(order: StoredOrder): Promise<void> {
  if (!isOrderEmailConfigured()) {
    console.error("Sipariş e-postası gönderilemedi: RESEND_API_KEY tanımlı değil.");
    return;
  }

  const [customerAlreadySent, adminAlreadySent] = await Promise.all([
    hasSuccessfulOrderEmail(order.id, "order_confirmation"),
    hasSuccessfulOrderEmail(order.id, "admin_order_notification"),
  ]);

  const tasks: Promise<{ ok: true } | { ok: false; reason: string }>[] = [];

  if (!customerAlreadySent) {
    tasks.push(sendOrderConfirmationEmail(order));
  }
  if (!adminAlreadySent) {
    tasks.push(sendAdminOrderNotificationEmail(order));
  }

  if (tasks.length === 0) return;

  const results = await Promise.all(tasks);
  for (const result of results) {
    if (!result.ok) {
      console.error("Sipariş e-postası gönderilemedi:", result.reason);
    }
  }
}

export function getOrderEmailConfigSummary(): {
  configured: boolean;
  fromEmail: string;
  notifyEmail: string;
} {
  return {
    configured: isOrderEmailConfigured(),
    fromEmail: getResendFromEmail(),
    notifyEmail: getAdminNotifyEmail(),
  };
}
