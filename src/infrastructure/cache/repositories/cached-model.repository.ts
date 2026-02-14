/**
 * @module cached-model.repository
 * Cache-aside decorator for {@link ModelRepository}.
 * Wraps the inner PrismaModelRepository, caching reads and invalidating on writes.
 */

import { inject, injectable } from 'tsyringe';
import type { CreateModelData, ModelEntity } from '../../../domain/entities/model.entity.js';
import type { ModelRepository } from '../../../domain/repositories/model.repository.js';
import type { CacheService } from '../../../domain/services/cache.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { CacheConfig } from '../cache.config.js';
import { cacheAside, invalidatePatterns } from '../cache.utils.js';

@injectable()
export class CachedModelRepository implements ModelRepository {
	private readonly logger: Logger;
	private readonly domain = 'model';

	constructor(
		@inject(PRISMA_TOKENS.ModelRepository) private readonly inner: ModelRepository,
		@inject(TOKENS.CacheService) private readonly cache: CacheService,
		@inject(TOKENS.CacheConfig) private readonly config: CacheConfig,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'CachedModelRepository' });
	}

	private key(method: string, args: string): string {
		return `${this.config.keyPrefix}${this.domain}:${method}:${args}`;
	}

	async findAll(): Promise<Result<ModelEntity[], RepositoryError>> {
		if (!this.config.enabled) return this.inner.findAll();
		return cacheAside(this.cache, this.key('findAll', '{}'), this.config.ttl.model, () => this.inner.findAll(), this.logger);
	}

	async findById(id: string): Promise<Result<ModelEntity | null, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findById(id);
		return cacheAside(this.cache, this.key('findById', id), this.config.ttl.model, () => this.inner.findById(id), this.logger);
	}

	async findByNameAndBrand(name: string, brandRefId: number): Promise<Result<ModelEntity | null, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findByNameAndBrand(name, brandRefId);
		return cacheAside(this.cache, this.key('findByNameAndBrand', JSON.stringify({ name, brandRefId })), this.config.ttl.model, () => this.inner.findByNameAndBrand(name, brandRefId), this.logger);
	}

	async create(data: CreateModelData): Promise<Result<ModelEntity, RepositoryError>> {
		const result = await this.inner.create(data);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['model:*'], this.logger);
		}
		return result;
	}
}
