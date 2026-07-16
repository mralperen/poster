import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getActiveTotpSecret, verifyTotpCode } from "@/lib/admin-totp";

export const ADMIN_COOKIE = "theposterist_admin_session";

function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  return password || null;
}

export function isAdminConfigured(): boolean {
  return Boolean(getAdminPassword());
}

function sessionToken(): string | null {
  const password = getAdminPassword();
  if (!password) return null;
  return createHash("sha256")
    .update(`theposterist-admin:${password}`)
    .digest("hex");
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;

  const provided = Buffer.from(password.trim());
  const target = Buffer.from(expected);
  if (provided.length !== target.length) return false;

  return timingSafeEqual(provided, target);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = sessionToken();
  if (!token) return false;

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE)?.value;
  return session === token;
}

export function adminSessionValue(): string | null {
  return sessionToken();
}

export const getAdminToken = adminSessionValue;

export type AdminLoginResult =
  | { ok: true }
  | { ok: false; error: string; needsTotp?: boolean };

export async function verifyAdminLogin(
  password: string,
  totpCode?: string,
): Promise<AdminLoginResult> {
  if (!isAdminConfigured()) {
    return { ok: false, error: "Admin girişi yapılandırılmamış." };
  }

  if (!verifyAdminPassword(password)) {
    return { ok: false, error: "Hatalı şifre." };
  }

  const totpSecret = await getActiveTotpSecret();
  if (!totpSecret) {
    return { ok: true };
  }

  const code = totpCode?.replace(/\s/g, "") ?? "";
  if (!code) {
    return { ok: false, needsTotp: true, error: "Doğrulama kodu gerekli." };
  }

  if (!verifyTotpCode(totpSecret, code)) {
    return { ok: false, error: "Geçersiz doğrulama kodu." };
  }

  return { ok: true };
}
