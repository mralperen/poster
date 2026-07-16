import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  getAdminToken,
  isAdminConfigured,
  verifyAdminLogin,
} from "@/lib/auth";
import { isTotpRequired } from "@/lib/admin-totp";
import { clearRateLimit, consumeRateLimit } from "@/lib/rate-limit";
import { resolveClientIp } from "@/lib/paytr";

const LOGIN_LIMIT = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function GET() {
  return NextResponse.json({
    totpRequired: await isTotpRequired(),
    adminConfigured: isAdminConfigured(),
  });
}

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin girişi yapılandırılmamış. ADMIN_PASSWORD tanımlayın." },
      { status: 503 },
    );
  }

  const userIp = resolveClientIp(request);
  const rate = await consumeRateLimit(
    `admin-login:${userIp}`,
    LOGIN_LIMIT,
    LOGIN_WINDOW_MS,
  );

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Çok fazla deneme. ${rate.retryAfterSec ?? 60} saniye sonra tekrar deneyin.`,
      },
      { status: 429 },
    );
  }

  const body = (await request.json()) as {
    password?: string;
    totpCode?: string;
  };

  const result = await verifyAdminLogin(body.password ?? "", body.totpCode);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, needsTotp: result.needsTotp ?? false },
      { status: 401 },
    );
  }

  const sessionToken = getAdminToken();
  if (!sessionToken) {
    return NextResponse.json(
      { error: "Admin oturumu oluşturulamadı." },
      { status: 503 },
    );
  }

  await clearRateLimit(`admin-login:${userIp}`);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
