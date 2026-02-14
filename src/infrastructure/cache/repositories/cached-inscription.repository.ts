/**
 * @module cached-inscription.repository
 * Cache-aside decorator for {@link InscriptionRepository}.
 * Wraps the inner PrismaInscriptionRepository, caching reads and invalidating on writes.
 * Write operations cross-invalidate both inscription and travel caches,
 * since inscription changes affect travel seat availability and passenger lists.
 */

import { inject, injectable } from 'tsyringe';
import type { CreateInscriptionData, InscriptionEntity } from '../../../domain/entities/inscription.entity.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { CacheService } from '../../../domain/services/cache.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { CacheConfig } from '../cache.config.js';
import { cacheAside, invalidatePatterns } from '../cache.utils.js';

@injectable()
export class CachedInscriptionRepository implements InscriptionRepository {
	private readonly logger: Logger;
	private readonly domain = 'inscription';

	constructor(
		@inject(PRISMA_TOKENS.InscriptionRepository) private readonly inner: InscriptionRepository,
		@inject(TOKENS.CacheService) private readonly cache: CacheService,
		@inject(TOKENS.CacheConfig) private readonly config: CacheConfig,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'CachedInscriptionRepository' });
	}

	private key(method: string, args: string): string {
		return `${this.config.keyPrefix}${this.domain}:${method}:${args}`;
	}

	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: InscriptionEntity[]; total: number }, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findAll(params);
		return cacheAside(this.cache, this.key('findAll', JSON.stringify(params ?? {})), this.config.ttl.inscription, () => this.inner.findAll(params), this.logger);
	}

	async findById(id: string): Promise<Result<InscriptionEntity | null, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findById(id);
		return cacheAside(this.cache, this.key('findById', id), this.config.ttl.inscription, () => this.inner.findById(id), this.logger);
	}

	async findByUserRefId(userRefId: number): Promise<Result<InscriptionEntity[], RepositoryError>> {
		if (!this.config.enabled) return this.inner.findByUserRefId(userRefId);
		return cacheAside(this.cache, this.key('findByUserRefId', String(userRefId)), this.config.ttl.inscription, () => this.inner.findByUserRefId(userRefId), this.logger);
	}

	async findByRouteRefId(routeRefId: number): Promise<Result<InscriptionEntity[], RepositoryError>> {
		if (!this.config.enabled) return this.inner.findByRouteRefId(routeRefId);
		return cacheAside(this.cache, this.key('findByRouteRefId', String(routeRefId)), this.config.ttl.inscription, () => this.inner.findByRouteRefId(routeRefId), this.logger);
	}

	async existsByUserAndRoute(userRefId: number, routeRefId: number): Promise<Result<boolean, RepositoryError>> {
		if (!this.config.enabled) return this.inner.existsByUserAndRoute(userRefId, routeRefId);
		return cacheAside(this.cache, this.key('existsByUserAndRoute', JSON.stringify({ userRefId, routeRefId })), this.config.ttl.inscription, () => this.inner.existsByUserAndRoute(userRefId, routeRefId), this.logger);
	}

	async countByRouteRefId(routeRefId: number): Promise<Result<number, RepositoryError>> {
		if (!this.config.enabled) return this.inner.countByRouteRefId(routeRefId);
		return cacheAside(this.cache, this.key('countByRouteRefId', String(routeRefId)), this.config.ttl.inscription, () => this.inner.countByRouteRefId(routeRefId), this.logger);
	}

	async create(data: CreateInscriptionData): Promise<Result<InscriptionEntity, RepositoryError>> {
		const result = await this.inner.create(data);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['inscription:*', 'travel:*'], this.logger);
		}
		return result;
	}

	async delete(id: string): Promise<Result<void, RepositoryError>> {
		const result = await this.inner.delete(id);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['inscription:*', 'travel:*'], this.logger);
		}
		return result;
	}
}
