/**
 * @module cached-car.repository
 * Cache-aside decorator for {@link CarRepository}.
 * Wraps the inner PrismaCarRepository, caching reads and invalidating on writes.
 */

import { inject, injectable } from 'tsyringe';
import type { CarEntity, CreateCarData, UpdateCarData } from '../../../domain/entities/car.entity.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { CacheService } from '../../../domain/services/cache.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { CacheConfig } from '../cache.config.js';
import { cacheAside, invalidatePatterns } from '../cache.utils.js';

@injectable()
export class CachedCarRepository implements CarRepository {
	private readonly logger: Logger;
	private readonly domain = 'car';

	constructor(
		@inject(PRISMA_TOKENS.CarRepository) private readonly inner: CarRepository,
		@inject(TOKENS.CacheService) private readonly cache: CacheService,
		@inject(TOKENS.CacheConfig) private readonly config: CacheConfig,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'CachedCarRepository' });
	}

	private key(method: string, args: string): string {
		return `${this.config.keyPrefix}${this.domain}:${method}:${args}`;
	}

	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: CarEntity[]; total: number }, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findAll(params);
		return cacheAside(this.cache, this.key('findAll', JSON.stringify(params ?? {})), this.config.ttl.car, () => this.inner.findAll(params), this.logger);
	}

	async findById(id: string): Promise<Result<CarEntity | null, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findById(id);
		return cacheAside(this.cache, this.key('findById', id), this.config.ttl.car, () => this.inner.findById(id), this.logger);
	}

	async existsByLicensePlate(licensePlate: string): Promise<Result<boolean, RepositoryError>> {
		if (!this.config.enabled) return this.inner.existsByLicensePlate(licensePlate);
		return cacheAside(this.cache, this.key('existsByLicensePlate', licensePlate), this.config.ttl.car, () => this.inner.existsByLicensePlate(licensePlate), this.logger);
	}

	async create(data: CreateCarData): Promise<Result<CarEntity, RepositoryError>> {
		const result = await this.inner.create(data);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['car:*'], this.logger);
		}
		return result;
	}

	async update(id: string, data: UpdateCarData): Promise<Result<CarEntity, RepositoryError>> {
		const result = await this.inner.update(id, data);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['car:*'], this.logger);
		}
		return result;
	}

	async delete(id: string): Promise<Result<void, RepositoryError>> {
		const result = await this.inner.delete(id);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['car:*'], this.logger);
		}
		return result;
	}
}
