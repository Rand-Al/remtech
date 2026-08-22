export type RateWindow = {
  count: number;
  resetAt: number;
};

export type RateLimiter = {
  check(key: string): boolean;
  remainingCooldownSeconds(key: string): number;
};

// Фиксированное окно на ключ (IP): в пределах окна допускается limit срабатываний
export function createRateLimiter(
  limit: number,
  windowMs: number,
  now: () => number = () => Date.now()
): RateLimiter {
  const windows = new Map<string, RateWindow>();

  const windowFor = (key: string): RateWindow => {
    const timestamp = now();
    let entry = windows.get(key);
    if (!entry || entry.resetAt <= timestamp) {
      entry = { count: 0, resetAt: timestamp + windowMs };
      windows.set(key, entry);
    }
    return entry;
  };

  return {
    check(key: string): boolean {
      const entry = windowFor(key);
      if (entry.count >= limit) return false;
      entry.count += 1;
      return true;
    },
    remainingCooldownSeconds(key: string): number {
      const entry = windows.get(key);
      if (!entry) return 0;
      return Math.max(0, Math.ceil((entry.resetAt - now()) / 1000));
    },
  };
}
