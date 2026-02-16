/**
 * @module cached-inscription.repository
 * Cache-aside decorator for {@link InscriptionRepository}.
 * Wraps the inner PrismaInscriptionRepository, caching reads and invalidating on writes.
 * Write operations cross-invalidate both inscription and trip caches,
 * since inscription changes affect trip seat availability and passenger lists.
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

	async findByTripRefId(tripRefId: number): Promise<Result<InscriptionEntity[], RepositoryError>> {
		if (!this.config.enabled) return this.inner.findByTripRefId(tripRefId);
		return cacheAside(this.cache, this.key('findByTripRefId', String(tripRefId)), this.config.ttl.inscription, () => this.inner.findByTripRefId(tripRefId), this.logger);
	}

	async findByUserId(userId: string): Promise<Result<InscriptionEntity[], RepositoryError>> {
		if (!this.config.enabled) return this.inner.findByUserId(userId);
		return cacheAside(this.cache, this.key('findByUserId', userId), this.config.ttl.inscription, () => this.inner.findByUserId(userId), this.logger);
	}

	async findByTripId(tripId: string): Promise<Result<InscriptionEntity[], RepositoryError>> {
		if (!this.config.enabled) return this.inner.findByTripId(tripId);
		return cacheAside(this.cache, this.key('findByTripId', tripId), this.config.ttl.inscription, () => this.inner.findByTripId(tripId), this.logger);
	}

	async findByIdAndUserId(id: string, userId: string): Promise<Result<InscriptionEntity | null, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findByIdAndUserId(id, userId);
		return cacheAside(this.cache, this.key('findByIdAndUserId', `${id}:${userId}`), this.config.ttl.inscription, () => this.inner.findByIdAndUserId(id, userId), this.logger);
	}

	async existsByUserAndTrip(userRefId: number, tripRefId: number): Promise<Result<boolean, RepositoryError>> {
		if (!this.config.enabled) return this.inner.existsByUserAndTrip(userRefId, tripRefId);
		return cacheAside(this.cache, this.key('existsByUserAndTrip', JSON.stringify({ userRefId, tripRefId })), this.config.ttl.inscription, () => this.inner.existsByUserAndTrip(userRefId, tripRefId), this.logger);
	}

	async countByTripRefId(tripRefId: number): Promise<Result<number, RepositoryError>> {
		if (!this.config.enabled) return this.inner.countByTripRefId(tripRefId);
		return cacheAside(this.cache, this.key('countByTripRefId', String(tripRefId)), this.config.ttl.inscription, () => this.inner.countByTripRefId(tripRefId), this.logger);
	}

	async create(data: CreateInscriptionData): Promise<Result<InscriptionEntity, RepositoryError>> {
		const result = await this.inner.create(data);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['inscription:*', 'trip:*'], this.logger);
		}
		return result;
	}

	async delete(id: string): Promise<Result<void, RepositoryError>> {
		const result = await this.inner.delete(id);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['inscription:*', 'trip:*'], this.logger);
		}
		return result;
	}
}
