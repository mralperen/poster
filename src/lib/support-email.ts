import { recordEmailLog } from "@/lib/db/email-log-store";
import { getInboxEmailById } from "@/lib/db/inbox-store";
import { renderSupportEmail, replySubject } from "@/lib/email-templates";
import {
  getSupportReplyToEmail,
  parseEmailAddress,
  sendResendEmail,
} from "@/lib/resend-client";

export async function sendSupportEmail(input: {
  to: string;
  subject: string;
  message: string;
  recipientName?: string;
  inboxId?: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const to = parseEmailAddress(input.to);
  if (!to.includes("@")) {
    return { ok: false, reason: "Geçerli bir alıcı e-postası girin." };
  }

  const message = input.message.trim();
  if (!message) {
    return { ok: false, reason: "Mesaj boş olamaz." };
  }

  const subject = input.subject.trim();
  if (!subject) {
    return { ok: false, reason: "Konu boş olamaz." };
  }

  const template = renderSupportEmail({
    subject,
    message,
    recipientName: input.recipientName,
  });

  const headers: Record<string, string> = {};
  if (input.inboxId) {
    const inboxEmail = await getInboxEmailById(input.inboxId);
    if (inboxEmail?.resendEmailId) {
      const messageId = `<${inboxEmail.resendEmailId}@resend.dev>`;
      headers["In-Reply-To"] = messageId;
      headers.References = messageId;
    }
  }

  const result = await sendResendEmail({
    to,
    subject: template.subject,
    html: template.html,
    replyTo: getSupportReplyToEmail(),
    headers,
  });

  await recordEmailLog({
    type: "support",
    to,
    subject: template.subject,
    html: template.html,
    status: result.ok ? "sent" : "failed",
    error: result.ok ? undefined : result.reason,
  });

  return result;
}

export async function sendInboxReply(input: {
  inboxId: string;
  message: string;
  subject?: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const inboxEmail = await getInboxEmailById(input.inboxId);
  if (!inboxEmail) {
    return { ok: false, reason: "Gelen e-posta bulunamadı." };
  }

  const fromAddress = parseEmailAddress(inboxEmail.from);
  const subject = input.subject?.trim() || replySubject(inboxEmail.subject);
  const nameMatch = inboxEmail.from.match(/^([^<]+)</);
  const recipientName = nameMatch?.[1]?.trim().replace(/"/g, "");

  return sendSupportEmail({
    to: fromAddress,
    subject,
    message: input.message,
    recipientName: recipientName || undefined,
    inboxId: inboxEmail.id,
  });
}
