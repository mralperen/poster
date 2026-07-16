import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  createTotpSetup,
  getActiveTotpSecret,
  getTotpStatus,
  isTotpLockedByEnv,
  isTotpRequired,
  removeStoredTotpConfig,
  saveTotpConfig,
  verifyTotpCode,
} from "@/lib/admin-totp";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const status = await getTotpStatus();
  return NextResponse.json({
    ...status,
    lockedByEnv: isTotpLockedByEnv(),
  });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  if (isTotpLockedByEnv()) {
    return NextResponse.json(
      { error: "2FA ADMIN_TOTP_SECRET ile yapılandırılmış; panelden değiştirilemez." },
      { status: 400 },
    );
  }

  if (await isTotpRequired()) {
    return NextResponse.json({ error: "2FA zaten etkin." }, { status: 400 });
  }

  const { secret, uri } = createTotpSetup();
  const qrDataUrl = await QRCode.toDataURL(uri, {
    margin: 1,
    width: 240,
  });

  return NextResponse.json({ secret, uri, qrDataUrl });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  if (isTotpLockedByEnv()) {
    return NextResponse.json(
      { error: "2FA ADMIN_TOTP_SECRET ile yapılandırılmış; panelden değiştirilemez." },
      { status: 400 },
    );
  }

  const body = (await request.json()) as { secret?: string; code?: string };
  const secret = body.secret?.trim();
  const code = body.code?.trim();

  if (!secret || !code) {
    return NextResponse.json(
      { error: "Secret ve doğrulama kodu gerekli." },
      { status: 400 },
    );
  }

  if (!verifyTotpCode(secret, code)) {
    return NextResponse.json(
      { error: "Doğrulama kodu geçersiz. Authenticator saatinizi kontrol edin." },
      { status: 400 },
    );
  }

  const config = await saveTotpConfig(secret);
  return NextResponse.json({
    ok: true,
    enabledAt: config.enabledAt,
  });
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  if (isTotpLockedByEnv()) {
    return NextResponse.json(
      { error: "2FA ADMIN_TOTP_SECRET ile yapılandırılmış; panelden kapatılamaz." },
      { status: 400 },
    );
  }

  const body = (await request.json()) as { code?: string };
  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json(
      { error: "Kapatmak için doğrulama kodu gerekli." },
      { status: 400 },
    );
  }

  const secret = await getActiveTotpSecret();
  if (!secret) {
    return NextResponse.json({ error: "2FA zaten kapalı." }, { status: 400 });
  }

  if (!verifyTotpCode(secret, code)) {
    return NextResponse.json(
      { error: "Doğrulama kodu geçersiz. Authenticator saatinizi kontrol edin." },
      { status: 400 },
    );
  }

  await removeStoredTotpConfig();
  return NextResponse.json({ ok: true });
}
