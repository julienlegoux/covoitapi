/**
 * @module cached-city.repository
 * Cache-aside decorator for {@link CityRepository}.
 * Wraps the inner PrismaCityRepository, caching reads and invalidating on writes.
 */

import { inject, injectable } from 'tsyringe';
import type { CityEntity, CreateCityData } from '../../../domain/entities/city.entity.js';
import type { CityRepository } from '../../../domain/repositories/city.repository.js';
import type { CacheService } from '../../../domain/services/cache.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { CacheConfig } from '../cache.config.js';
import { cacheAside, invalidatePatterns } from '../cache.utils.js';

@injectable()
export class CachedCityRepository implements CityRepository {
	private readonly logger: Logger;
	private readonly domain = 'city';

	constructor(
		@inject(PRISMA_TOKENS.CityRepository) private readonly inner: CityRepository,
		@inject(TOKENS.CacheService) private readonly cache: CacheService,
		@inject(TOKENS.CacheConfig) private readonly config: CacheConfig,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'CachedCityRepository' });
	}

	private key(method: string, args: string): string {
		return `${this.config.keyPrefix}${this.domain}:${method}:${args}`;
	}

	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: CityEntity[]; total: number }, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findAll(params);
		return cacheAside(this.cache, this.key('findAll', JSON.stringify(params ?? {})), this.config.ttl.city, () => this.inner.findAll(params), this.logger);
	}

	async findById(id: string): Promise<Result<CityEntity | null, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findById(id);
		return cacheAside(this.cache, this.key('findById', id), this.config.ttl.city, () => this.inner.findById(id), this.logger);
	}

	async findByCityName(name: string): Promise<Result<CityEntity | null, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findByCityName(name);
		return cacheAside(this.cache, this.key('findByCityName', name), this.config.ttl.city, () => this.inner.findByCityName(name), this.logger);
	}

	async create(data: CreateCityData): Promise<Result<CityEntity, RepositoryError>> {
		const result = await this.inner.create(data);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['city:*'], this.logger);
		}
		return result;
	}

	async delete(id: string): Promise<Result<void, RepositoryError>> {
		const result = await this.inner.delete(id);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['city:*'], this.logger);
		}
		return result;
	}
}
