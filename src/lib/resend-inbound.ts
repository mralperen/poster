import type { InboxAttachment } from "@/lib/db/inbox-store";

type ResendReceivedEmail = {
  id?: string;
  from?: string;
  to?: string[];
  created_at?: string;
  subject?: string;
  html?: string | null;
  text?: string | null;
  attachments?: Array<{
    id?: string;
    filename?: string;
    content_type?: string;
    size?: number;
  }>;
};

type ResendWebhookPayload = {
  type?: string;
  data?: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    created_at?: string;
    attachments?: ResendReceivedEmail["attachments"];
  };
};

export function isInboundEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function fetchResendReceivedEmail(
  emailId: string,
): Promise<ResendReceivedEmail | null> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;

  const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as ResendReceivedEmail;
}

export function mapResendEmailToInbox(
  resend: ResendReceivedEmail,
  fallback?: ResendWebhookPayload["data"],
): {
  resendEmailId: string;
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
  receivedAt: string;
  attachments: InboxAttachment[];
} {
  const attachments = (resend.attachments ?? fallback?.attachments ?? [])
    .filter((item) => item.id && item.filename)
    .map((item) => ({
      id: item.id!,
      filename: item.filename!,
      contentType: item.content_type ?? "application/octet-stream",
      size: item.size,
    }));

  return {
    resendEmailId: resend.id ?? fallback?.email_id ?? "",
    from: resend.from ?? fallback?.from ?? "Bilinmeyen gönderen",
    to: resend.to ?? fallback?.to ?? [],
    subject: resend.subject ?? fallback?.subject ?? "(Konu yok)",
    text: resend.text ?? "",
    html: resend.html ?? "",
    receivedAt: resend.created_at ?? fallback?.created_at ?? new Date().toISOString(),
    attachments,
  };
}

export function parseResendInboundWebhook(body: unknown): ResendWebhookPayload {
  return body as ResendWebhookPayload;
}
