import { brand } from "@/lib/brand";

export function parseEmailAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  if (match) return match[1].trim();
  return raw.trim();
}

export function getResendFromEmail(): string {
  return (
    process.env.ORDER_FROM_EMAIL?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "The Posterist <onboarding@resend.dev>"
  );
}

export function getSupportReplyToEmail(): string {
  return process.env.ORDER_NOTIFY_EMAIL?.trim() || brand.supportEmail;
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  headers?: Record<string, string>;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, reason: "RESEND_API_KEY tanımlı değil." };
  }

  const body: Record<string, unknown> = {
    from: getResendFromEmail(),
    to: [input.to],
    subject: input.subject,
    html: input.html,
  };

  if (input.replyTo) {
    body.reply_to = input.replyTo;
  }

  if (input.headers && Object.keys(input.headers).length > 0) {
    body.headers = input.headers;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const raw = await response.text();
    return { ok: false, reason: raw || "E-posta gönderilemedi." };
  }

  return { ok: true };
}
