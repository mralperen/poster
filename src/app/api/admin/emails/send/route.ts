import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { sendInboxReply, sendSupportEmail } from "@/lib/support-email";

type SendBody = {
  mode: "reply" | "compose";
  inboxId?: string;
  to?: string;
  subject?: string;
  message?: string;
  recipientName?: string;
};

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  let body: SendBody;

  try {
    body = (await request.json()) as SendBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ error: "Mesaj boş olamaz." }, { status: 400 });
  }

  if (body.mode === "reply") {
    if (!body.inboxId) {
      return NextResponse.json({ error: "Gelen e-posta seçilmedi." }, { status: 400 });
    }

    const result = await sendInboxReply({
      inboxId: body.inboxId,
      message,
      subject: body.subject,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 422 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.mode === "compose") {
    const to = body.to?.trim() ?? "";
    const subject = body.subject?.trim() ?? "";

    if (!to) {
      return NextResponse.json({ error: "Alıcı e-postası gerekli." }, { status: 400 });
    }

    if (!subject) {
      return NextResponse.json({ error: "Konu gerekli." }, { status: 400 });
    }

    const result = await sendSupportEmail({
      to,
      subject,
      message,
      recipientName: body.recipientName,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 422 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Geçersiz gönderim modu." }, { status: 400 });
}
