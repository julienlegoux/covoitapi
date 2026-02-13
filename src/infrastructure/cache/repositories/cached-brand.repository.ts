/**
 * @module cached-brand.repository
 * Cache-aside decorator for {@link BrandRepository}.
 * Wraps the inner PrismaBrandRepository, caching reads and invalidating on writes.
 */

import { inject, injectable } from 'tsyringe';
import type { BrandEntity, CreateBrandData } from '../../../domain/entities/brand.entity.js';
import type { BrandRepository } from '../../../domain/repositories/brand.repository.js';
import type { CacheService } from '../../../domain/services/cache.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { CacheConfig } from '../cache.config.js';
import { cacheAside, invalidatePatterns } from '../cache.utils.js';

@injectable()
export class CachedBrandRepository implements BrandRepository {
	private readonly logger: Logger;
	private readonly domain = 'brand';

	constructor(
		@inject(PRISMA_TOKENS.BrandRepository) private readonly inner: BrandRepository,
		@inject(TOKENS.CacheService) private readonly cache: CacheService,
		@inject(TOKENS.CacheConfig) private readonly config: CacheConfig,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'CachedBrandRepository' });
	}

	private key(method: string, args: string): string {
		return `${this.config.keyPrefix}${this.domain}:${method}:${args}`;
	}

	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: BrandEntity[]; total: number }, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findAll(params);
		return cacheAside(this.cache, this.key('findAll', JSON.stringify(params ?? {})), this.config.ttl.brand, () => this.inner.findAll(params), this.logger);
	}

	async findById(id: string): Promise<Result<BrandEntity | null, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findById(id);
		return cacheAside(this.cache, this.key('findById', id), this.config.ttl.brand, () => this.inner.findById(id), this.logger);
	}

	async create(data: CreateBrandData): Promise<Result<BrandEntity, RepositoryError>> {
		const result = await this.inner.create(data);
		if (this.config.enabled) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['brand:*'], this.logger);
		}
		return result;
	}

	async delete(id: string): Promise<Result<void, RepositoryError>> {
		const result = await this.inner.delete(id);
		if (this.config.enabled) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['brand:*'], this.logger);
		}
		return result;
	}
}
