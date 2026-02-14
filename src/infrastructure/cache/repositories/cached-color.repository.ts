/**
 * @module cached-color.repository
 * Cache-aside decorator for {@link ColorRepository}.
 * Wraps the inner PrismaColorRepository, caching reads and invalidating on writes.
 */

import { inject, injectable } from 'tsyringe';
import type { ColorEntity } from '../../../domain/entities/color.entity.js';
import type { ColorRepository, CreateColorData, UpdateColorData } from '../../../domain/repositories/color.repository.js';
import type { CacheService } from '../../../domain/services/cache.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { CacheConfig } from '../cache.config.js';
import { cacheAside, invalidatePatterns } from '../cache.utils.js';

@injectable()
export class CachedColorRepository implements ColorRepository {
	private readonly logger: Logger;
	private readonly domain = 'color';

	constructor(
		@inject(PRISMA_TOKENS.ColorRepository) private readonly inner: ColorRepository,
		@inject(TOKENS.CacheService) private readonly cache: CacheService,
		@inject(TOKENS.CacheConfig) private readonly config: CacheConfig,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'CachedColorRepository' });
	}

	private key(method: string, args: string): string {
		return `${this.config.keyPrefix}${this.domain}:${method}:${args}`;
	}

	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: ColorEntity[]; total: number }, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findAll(params);
		return cacheAside(this.cache, this.key('findAll', JSON.stringify(params ?? {})), this.config.ttl.color, () => this.inner.findAll(params), this.logger);
	}

	async findById(id: string): Promise<Result<ColorEntity | null, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findById(id);
		return cacheAside(this.cache, this.key('findById', id), this.config.ttl.color, () => this.inner.findById(id), this.logger);
	}

	async findByName(name: string): Promise<Result<ColorEntity | null, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findByName(name);
		return cacheAside(this.cache, this.key('findByName', name), this.config.ttl.color, () => this.inner.findByName(name), this.logger);
	}

	async create(data: CreateColorData): Promise<Result<ColorEntity, RepositoryError>> {
		const result = await this.inner.create(data);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['color:*'], this.logger);
		}
		return result;
	}

	async update(id: string, data: UpdateColorData): Promise<Result<ColorEntity, RepositoryError>> {
		const result = await this.inner.update(id, data);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['color:*'], this.logger);
		}
		return result;
	}

	async delete(id: string): Promise<Result<void, RepositoryError>> {
		const result = await this.inner.delete(id);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['color:*'], this.logger);
		}
		return result;
	}
}
