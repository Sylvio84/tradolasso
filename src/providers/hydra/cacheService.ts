interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<unknown>>;
  private readonly DEFAULT_TTL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get cached value. Returns null if not found or expired.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now >= entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache value with optional TTL (defaults to 4 hours).
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const actualTtl = ttl !== undefined ? ttl : this.DEFAULT_TTL;

    this.cache.set(key, {
      data: value,
      timestamp: now,
      expiresAt: now + actualTtl,
    });
  }

  /**
   * Delete specific cache entry.
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if cache entry exists and is valid (not expired).
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now >= entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const cacheService = new CacheService();
