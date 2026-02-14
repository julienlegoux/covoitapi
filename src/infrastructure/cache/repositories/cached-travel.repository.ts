/**
 * @module cached-travel.repository
 * Cache-aside decorator for {@link TravelRepository}.
 * Wraps the inner PrismaTravelRepository, caching reads and invalidating on writes.
 */

import { inject, injectable } from 'tsyringe';
import type { CreateTravelData, TravelEntity } from '../../../domain/entities/travel.entity.js';
import type { TravelFilters, TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { CacheService } from '../../../domain/services/cache.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { CacheConfig } from '../cache.config.js';
import { cacheAside, invalidatePatterns } from '../cache.utils.js';

@injectable()
export class CachedTravelRepository implements TravelRepository {
	private readonly logger: Logger;
	private readonly domain = 'travel';

	constructor(
		@inject(PRISMA_TOKENS.TravelRepository) private readonly inner: TravelRepository,
		@inject(TOKENS.CacheService) private readonly cache: CacheService,
		@inject(TOKENS.CacheConfig) private readonly config: CacheConfig,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'CachedTravelRepository' });
	}

	private key(method: string, args: string): string {
		return `${this.config.keyPrefix}${this.domain}:${method}:${args}`;
	}

	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: TravelEntity[]; total: number }, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findAll(params);
		return cacheAside(this.cache, this.key('findAll', JSON.stringify(params ?? {})), this.config.ttl.travel, () => this.inner.findAll(params), this.logger);
	}

	async findById(id: string): Promise<Result<TravelEntity | null, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findById(id);
		return cacheAside(this.cache, this.key('findById', id), this.config.ttl.travel, () => this.inner.findById(id), this.logger);
	}

	async findByFilters(filters: TravelFilters): Promise<Result<TravelEntity[], RepositoryError>> {
		if (!this.config.enabled) return this.inner.findByFilters(filters);
		return cacheAside(this.cache, this.key('findByFilters', JSON.stringify(filters)), this.config.ttl.travel, () => this.inner.findByFilters(filters), this.logger);
	}

	async create(data: CreateTravelData): Promise<Result<TravelEntity, RepositoryError>> {
		const result = await this.inner.create(data);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['travel:*'], this.logger);
		}
		return result;
	}

	async delete(id: string): Promise<Result<void, RepositoryError>> {
		const result = await this.inner.delete(id);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['travel:*', 'inscription:*'], this.logger);
		}
		return result;
	}
}
