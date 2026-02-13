/**
 * @module cached-driver.repository
 * Cache-aside decorator for {@link DriverRepository}.
 * Wraps the inner PrismaDriverRepository, caching reads and invalidating on writes.
 */

import { inject, injectable } from 'tsyringe';
import type { CreateDriverData, DriverEntity } from '../../../domain/entities/driver.entity.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import type { CacheService } from '../../../domain/services/cache.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { CacheConfig } from '../cache.config.js';
import { cacheAside, invalidatePatterns } from '../cache.utils.js';

@injectable()
export class CachedDriverRepository implements DriverRepository {
	private readonly logger: Logger;
	private readonly domain = 'driver';

	constructor(
		@inject(PRISMA_TOKENS.DriverRepository) private readonly inner: DriverRepository,
		@inject(TOKENS.CacheService) private readonly cache: CacheService,
		@inject(TOKENS.CacheConfig) private readonly config: CacheConfig,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'CachedDriverRepository' });
	}

	private key(method: string, args: string): string {
		return `${this.config.keyPrefix}${this.domain}:${method}:${args}`;
	}

	async findByUserRefId(userRefId: number): Promise<Result<DriverEntity | null, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findByUserRefId(userRefId);
		return cacheAside(this.cache, this.key('findByUserRefId', String(userRefId)), this.config.ttl.driver, () => this.inner.findByUserRefId(userRefId), this.logger);
	}

	async create(data: CreateDriverData): Promise<Result<DriverEntity, RepositoryError>> {
		const result = await this.inner.create(data);
		if (this.config.enabled) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['driver:*'], this.logger);
		}
		return result;
	}
}
