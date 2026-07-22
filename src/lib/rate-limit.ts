type RateLimitEntry = {
  count: number;
  windowStart: number;
};

type RateLimitStore = Record<string, RateLimitEntry>;

const g = globalThis as typeof globalThis & {
  __posterRateLimits?: RateLimitStore;
};

function store(): RateLimitStore {
  if (!g.__posterRateLimits) g.__posterRateLimits = {};
  return g.__posterRateLimits;
}

/**
 * Bellek içi rate limit — Blob okuma/yazma yok.
 * (Eski sürüm her login denemesinde Blob Simple/Advanced op yakıyordu.)
 */
export async function consumeRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  const data = store();
  const now = Date.now();
  const entry = data[key];

  if (!entry || now - entry.windowStart >= windowMs) {
    data[key] = { count: 1, windowStart: now };
    return { allowed: true };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterSec = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  entry.count += 1;
  data[key] = entry;
  return { allowed: true };
}

export async function clearRateLimit(key: string): Promise<void> {
  delete store()[key];
}
