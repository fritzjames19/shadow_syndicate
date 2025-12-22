import { AI_LIMITS } from "../config/aiLimits";

interface CacheEntry {
  value: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function makeKey(payload: any): string {
  // Deterministic key based on input payload
  return JSON.stringify(payload);
}

export function getCached(payload: any): any | null {
  const key = makeKey(payload);
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  console.log("AI Cache Hit");
  return entry.value;
}

export function setCached(payload: any, value: any): void {
  const key = makeKey(payload);
  cache.set(key, {
    value,
    expiresAt: Date.now() + (AI_LIMITS.CACHE_TTL_SECONDS * 1000)
  });
}