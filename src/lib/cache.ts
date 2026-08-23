import NodeCache from 'node-cache';

// Simple in-memory cache for frequently accessed data
export const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

export function getCache<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function setCache<T>(key: string, value: T, ttl = 300): void {
  cache.set(key, value, ttl);
}

export function clearCache(pattern?: string): void {
  if (pattern) {
    const keys = cache.keys().filter(k => k.includes(pattern));
    cache.del(keys);
  } else {
    cache.flushAll();
  }
}
