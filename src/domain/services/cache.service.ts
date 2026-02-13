/**
 * @module cache.service
 * Defines the cache service interface.
 * This contract abstracts cache operations (get/set/delete/pattern-delete/health),
 * allowing different cache backends (Upstash, ioredis, in-memory) to be swapped via DI.
 */

export interface CacheService {
	/** Retrieve a cached value by key. Returns null on miss. */
	get<T>(key: string): Promise<T | null>;

	/** Store a value under key with a TTL in seconds. */
	set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;

	/** Delete a single key. */
	delete(key: string): Promise<void>;

	/** Delete all keys matching a glob pattern (e.g. "city:*"). */
	deleteByPattern(pattern: string): Promise<void>;

	/** Check if the cache backend is reachable. */
	isHealthy(): Promise<boolean>;
}
