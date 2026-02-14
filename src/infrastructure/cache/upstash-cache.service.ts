/**
 * @module upstash-cache.service
 * Upstash Redis implementation of the {@link CacheService} domain interface.
 * Uses the `@upstash/redis` REST-based client for serverless-friendly caching.
 * Configured through UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * environment variables.
 */

import { Redis } from '@upstash/redis';
import { inject, injectable } from 'tsyringe';
import type { CacheService } from '../../domain/services/cache.service.js';
import type { Logger } from '../../lib/logging/logger.types.js';
import { TOKENS } from '../../lib/shared/di/tokens.js';

/**
 * Upstash implementation of {@link CacheService}.
 * Uses the Upstash REST API for all cache operations.
 * The URL and token are read from environment variables at construction.
 * Injected via tsyringe as a singleton.
 */
@injectable()
export class UpstashCacheService implements CacheService {
	private readonly redis: Redis;
	private readonly logger: Logger;

	constructor(@inject(TOKENS.Logger) logger: Logger) {
		this.logger = logger.child({ service: 'CacheService' });
		this.redis = new Redis({
			url: process.env.UPSTASH_REDIS_REST_URL!,
			token: process.env.UPSTASH_REDIS_REST_TOKEN!,
		});
	}

	async get<T>(key: string): Promise<T | null> {
		const value = await this.redis.get<T>(key);
		return value ?? null;
	}

	async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
		await this.redis.set(key, value, { ex: ttlSeconds });
	}

	async delete(key: string): Promise<void> {
		await this.redis.del(key);
	}

	async deleteByPattern(pattern: string): Promise<void> {
		let cursor = '0';
		do {
			const result: [string, string[]] = await this.redis.scan(cursor, {
				match: pattern,
				count: 100,
			});
			cursor = result[0];
			const keys = result[1];
			if (keys.length > 0) {
				const pipeline = this.redis.pipeline();
				for (const key of keys) {
					pipeline.del(key);
				}
				await pipeline.exec();
			}
		} while (cursor !== '0');
	}

	async isHealthy(): Promise<boolean> {
		try {
			const result = await this.redis.ping();
			return result === 'PONG';
		} catch {
			return false;
		}
	}
}
