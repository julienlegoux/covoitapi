/**
 * @module cache.errors
 * Defines error classes for cache operations.
 * These errors are returned by CacheService implementations (e.g. Upstash)
 * within the Result pattern.
 */

import { InfrastructureError } from './infrastructure.error.js';

/**
 * Base class for all cache-related errors.
 * @extends InfrastructureError
 */
export class CacheError extends InfrastructureError {
	constructor(message: string, code: string, cause?: unknown) {
		super(message, code, cause);
		this.name = 'CacheError';
	}
}

/**
 * Thrown when the cache backend is unreachable or connection fails.
 * Maps to HTTP 502 Bad Gateway.
 */
export class CacheConnectionError extends CacheError {
	constructor(cause?: unknown) {
		super('Cache connection failed', 'CACHE_CONNECTION_ERROR', cause);
		this.name = 'CacheConnectionError';
	}
}

/**
 * Thrown when a cache operation (get/set/delete) fails.
 * Maps to HTTP 500 Internal Server Error.
 */
export class CacheOperationError extends CacheError {
	constructor(operation: string, cause?: unknown) {
		super(`Cache operation failed: ${operation}`, 'CACHE_OPERATION_ERROR', cause);
		this.name = 'CacheOperationError';
	}
}
