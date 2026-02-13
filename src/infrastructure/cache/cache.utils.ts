/**
 * @module cache.utils
 * Shared cache-aside helper and invalidation utility reused by all cached repository decorators.
 * All Redis errors are caught and logged as warnings — the app never breaks due to cache failures.
 */

import type { CacheService } from '../../domain/services/cache.service.js';
import type { Result } from '../../lib/shared/types/result.js';
import { ok } from '../../lib/shared/types/result.js';
import type { Logger } from '../../lib/logging/logger.types.js';

/** Wrapper to distinguish a cached null from a cache miss. */
type CacheWrapper<T> = { __cached: true; data: T };

function isCacheWrapper<T>(value: unknown): value is CacheWrapper<T> {
	return (
		typeof value === 'object' &&
		value !== null &&
		'__cached' in value &&
		(value as CacheWrapper<T>).__cached === true
	);
}

/**
 * Cache-aside pattern: try cache first, fall back to source on miss or error.
 * Wraps cached data in `{ __cached: true, data }` to handle cached null values.
 */
export async function cacheAside<T, E>(
	cache: CacheService,
	key: string,
	ttl: number,
	source: () => Promise<Result<T, E>>,
	logger: Logger,
): Promise<Result<T, E>> {
	// 1. Try cache
	try {
		const cached = await cache.get<CacheWrapper<T>>(key);
		if (isCacheWrapper<T>(cached)) {
			logger.debug('Cache hit', { key });
			return ok(cached.data) as Result<T, E>;
		}
	} catch (error) {
		logger.warn('Cache read failed, falling through to DB', { key, error: String(error) });
	}

	// 2. Cache miss or error: call source
	const result = await source();

	// 3. If source succeeded, cache the result
	if (result.success) {
		try {
			const wrapper: CacheWrapper<T> = { __cached: true, data: result.value };
			await cache.set(key, wrapper, ttl);
		} catch (error) {
			logger.warn('Cache write failed', { key, error: String(error) });
		}
	}

	return result;
}

/**
 * Invalidates cache entries matching one or more glob patterns.
 * Prefixes each pattern with the configured key prefix.
 */
export async function invalidatePatterns(
	cache: CacheService,
	keyPrefix: string,
	patterns: string[],
	logger: Logger,
): Promise<void> {
	for (const pattern of patterns) {
		try {
			await cache.deleteByPattern(`${keyPrefix}${pattern}`);
		} catch (error) {
			logger.warn('Cache invalidation failed', { pattern, error: String(error) });
		}
	}
}
