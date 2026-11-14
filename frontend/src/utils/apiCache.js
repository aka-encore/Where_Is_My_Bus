import { api } from './api';

/**
 * High-performance in-memory client cache with TTL, in-flight request deduplication,
 * and stale-while-revalidate capabilities.
 */

// Default TTLs (in milliseconds)
export const CACHE_TTL = {
  STATIC: 5 * 60 * 1000,    // 5 minutes (routes, stops)
  STANDARD: 2 * 60 * 1000,  // 2 minutes (buses, drivers, students, assignments)
  DASHBOARD: 30 * 1000,     // 30 seconds (dashboard stats, active trips)
  SHORT: 10 * 1000          // 10 seconds (rapidly changing)
};

class ApiCache {
  constructor() {
    this.cache = new Map();
    this.inFlightRequests = new Map();
  }

  /**
   * Synchronously peek at existing cached data (even if slightly stale)
   * This allows instant initial rendering with zero spinner delay.
   */
  peek(key) {
    const entry = this.cache.get(key);
    return entry ? entry.data : null;
  }

  /**
   * Get cache entry with staleness check
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const isStale = now > entry.expiresAt;

    return {
      data: entry.data,
      isStale,
      timestamp: entry.timestamp
    };
  }

  /**
   * Save data into cache
   */
  set(key, data, ttlMs = CACHE_TTL.STANDARD) {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttlMs
    });
  }

  /**
   * Invalidate cached keys matching string or RegExp
   * e.g. cache.invalidate('/buses') or cache.invalidate(/^\/admin/)
   */
  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (typeof pattern === 'string' && key.includes(pattern)) {
        this.cache.delete(key);
      } else if (pattern instanceof RegExp && pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Purge all cache (e.g. on logout)
   */
  clear() {
    this.cache.clear();
    this.inFlightRequests.clear();
  }

  /**
   * Core Stale-While-Revalidate fetcher with request deduplication
   */
  async fetchWithCache(url, options = {}) {
    const {
      ttl = CACHE_TTL.STANDARD,
      forceFresh = false,
      onBackgroundUpdate = null
    } = options;

    const cached = this.get(url);

    // If we have valid cached data and don't require force-fresh:
    if (cached && !cached.isStale && !forceFresh) {
      return cached.data;
    }

    // If cached data is available (even if stale), we can return it and revalidate in background
    if (cached && cached.isStale && !forceFresh) {
      this.revalidateInBackground(url, ttl, onBackgroundUpdate);
      return cached.data;
    }

    // Deduplicate in-flight requests for the same URL
    if (this.inFlightRequests.has(url)) {
      return this.inFlightRequests.get(url);
    }

    const requestPromise = (async () => {
      try {
        const response = await api.get(url);
        this.set(url, response.data, ttl);
        return response.data;
      } finally {
        this.inFlightRequests.delete(url);
      }
    })();

    this.inFlightRequests.set(url, requestPromise);
    return requestPromise;
  }

  /**
   * Silent background revalidation
   */
  async revalidateInBackground(url, ttl, onBackgroundUpdate) {
    if (this.inFlightRequests.has(url)) return;

    const promise = (async () => {
      try {
        const response = await api.get(url);
        this.set(url, response.data, ttl);
        if (typeof onBackgroundUpdate === 'function') {
          onBackgroundUpdate(response.data);
        }
      } catch (err) {
        // Silent failure in background - keep existing cache
        console.warn(`[ApiCache] Background revalidation failed for ${url}:`, err.message);
      } finally {
        this.inFlightRequests.delete(url);
      }
    })();

    this.inFlightRequests.set(url, promise);
  }
}

export const apiCache = new ApiCache();

