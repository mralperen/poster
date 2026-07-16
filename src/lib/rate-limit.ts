import { readTextFile, writeTextFile } from "@/lib/db/storage";

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

type RateLimitStore = Record<string, RateLimitEntry>;

const DATA_FILE = "data/rate-limits.json";

async function readStore(): Promise<RateLimitStore> {
  const raw = await readTextFile(DATA_FILE);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as RateLimitStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: RateLimitStore, windowMs: number): Promise<void> {
  const now = Date.now();
  const pruned: RateLimitStore = {};

  for (const [key, entry] of Object.entries(store)) {
    if (now - entry.windowStart < windowMs * 2) {
      pruned[key] = entry;
    }
  }

  await writeTextFile(DATA_FILE, `${JSON.stringify(pruned)}\n`);
}

export async function consumeRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  const store = await readStore();
  const now = Date.now();
  const entry = store[key];

  if (!entry || now - entry.windowStart >= windowMs) {
    store[key] = { count: 1, windowStart: now };
    await writeStore(store, windowMs);
    return { allowed: true };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterSec = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  entry.count += 1;
  store[key] = entry;
  await writeStore(store, windowMs);
  return { allowed: true };
}

export async function clearRateLimit(key: string): Promise<void> {
  const store = await readStore();
  delete store[key];
  await writeStore(store, 15 * 60 * 1000);
}
