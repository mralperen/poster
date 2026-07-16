import { recordEmailLog, type EmailLogType } from "@/lib/db/email-log-store";
import type { StoredOrder } from "@/lib/db/orders-store";
import {
  renderAdminOrderNotificationEmail,
  renderCustomerOrderConfirmationEmail,
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

export async function sendOrderPaidEmails(order: StoredOrder): Promise<void> {
  if (!isOrderEmailConfigured()) return;

  const [customerResult, adminResult] = await Promise.all([
    sendOrderConfirmationEmail(order),
    sendAdminOrderNotificationEmail(order),
  ]);

  if (!customerResult.ok) {
    console.error("Müşteri onay e-postası gönderilemedi:", customerResult.reason);
  }
  if (!adminResult.ok) {
    console.error("Admin sipariş bildirimi gönderilemedi:", adminResult.reason);
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
