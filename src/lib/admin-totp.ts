import { generateSecret, generateURI, verifySync } from "otplib";
import { readTextFile, writeTextFile } from "@/lib/db/storage";

export type AdminTotpConfig = {
  secret: string;
  enabledAt: string;
};

const DATA_FILE = "data/admin-totp.json";
const TOTP_ISSUER = "The Posterist";

export function getEnvTotpSecret(): string | null {
  const secret = process.env.ADMIN_TOTP_SECRET?.trim();
  return secret || null;
}

export function isTotpLockedByEnv(): boolean {
  return Boolean(getEnvTotpSecret());
}

async function readStoredTotpConfig(): Promise<AdminTotpConfig | null> {
  const raw = await readTextFile(DATA_FILE);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AdminTotpConfig>;
    if (!parsed.secret?.trim()) return null;
    return {
      secret: parsed.secret.trim(),
      enabledAt: parsed.enabledAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getActiveTotpSecret(): Promise<string | null> {
  return getEnvTotpSecret() ?? (await readStoredTotpConfig())?.secret ?? null;
}

export async function isTotpRequired(): Promise<boolean> {
  return Boolean(await getActiveTotpSecret());
}

export async function getTotpStatus(): Promise<{
  enabled: boolean;
  source: "env" | "stored" | null;
  enabledAt: string | null;
}> {
  const envSecret = getEnvTotpSecret();
  if (envSecret) {
    return { enabled: true, source: "env", enabledAt: null };
  }

  const stored = await readStoredTotpConfig();
  if (stored) {
    return { enabled: true, source: "stored", enabledAt: stored.enabledAt };
  }

  return { enabled: false, source: null, enabledAt: null };
}

export function createTotpSetup(): { secret: string; uri: string } {
  const secret = generateSecret();
  const uri = generateURI({
    issuer: TOTP_ISSUER,
    label: "Admin",
    secret,
  });
  return { secret, uri };
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const token = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(token)) return false;

  const result = verifySync({
    secret,
    token,
    epochTolerance: 30,
  });

  return result.valid;
}

export async function saveTotpConfig(secret: string): Promise<AdminTotpConfig> {
  const config: AdminTotpConfig = {
    secret: secret.trim(),
    enabledAt: new Date().toISOString(),
  };
  await writeTextFile(DATA_FILE, `${JSON.stringify(config, null, 2)}\n`);
  return config;
}

export async function removeStoredTotpConfig(): Promise<void> {
  await writeTextFile(DATA_FILE, "{}\n");
}
