import { NextResponse } from "next/server";
import { recordInboxEmail } from "@/lib/db/inbox-store";
import {
  fetchResendReceivedEmail,
  mapResendEmailToInbox,
  parseResendInboundWebhook,
} from "@/lib/resend-inbound";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const payload = parseResendInboundWebhook(body);
  if (payload.type !== "email.received" || !payload.data?.email_id) {
    return NextResponse.json({ ok: true });
  }

  const emailId = payload.data.email_id;
  const fullEmail = await fetchResendReceivedEmail(emailId);
  const mapped = mapResendEmailToInbox(fullEmail ?? {}, payload.data);

  if (!mapped.resendEmailId) {
    return NextResponse.json({ error: "E-posta işlenemedi." }, { status: 422 });
  }

  await recordInboxEmail(mapped);

  return NextResponse.json({ ok: true });
}
