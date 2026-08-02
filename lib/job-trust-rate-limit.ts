type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 20;
const buckets = new Map<string, RateLimitEntry>();

export function checkJobTrustRateLimit(key: string) {
  const now = Date.now();
  const limit = configuredLimit();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: limit - 1, resetAt: now + WINDOW_MS };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  };
}

function configuredLimit() {
  const raw = Number.parseInt(process.env.JOB_TRUST_RATE_LIMIT_PER_MINUTE ?? "", 10);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_LIMIT;
  return raw;
}
