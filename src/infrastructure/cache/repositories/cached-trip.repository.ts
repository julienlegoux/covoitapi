/**
 * @module cached-trip.repository
 * Cache-aside decorator for {@link TripRepository}.
 * Wraps the inner PrismaTripRepository, caching reads and invalidating on writes.
 */

import { inject, injectable } from 'tsyringe';
import type { CreateTripData, TripEntity } from '../../../domain/entities/trip.entity.js';
import type { TripFilters, TripRepository } from '../../../domain/repositories/trip.repository.js';
import type { CacheService } from '../../../domain/services/cache.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { CacheConfig } from '../cache.config.js';
import { cacheAside, invalidatePatterns } from '../cache.utils.js';

@injectable()
export class CachedTripRepository implements TripRepository {
    private readonly logger: Logger;
    private readonly domain = 'trip';

    constructor(
        @inject(PRISMA_TOKENS.TripRepository) private readonly inner: TripRepository,
        @inject(TOKENS.CacheService) private readonly cache: CacheService,
        @inject(TOKENS.CacheConfig) private readonly config: CacheConfig,
        @inject(TOKENS.Logger) logger: Logger,
    ) {
        this.logger = logger.child({ repository: 'CachedTripRepository' });
    }

    private key(method: string, args: string): string {
        return `${this.config.keyPrefix}${this.domain}:${method}:${args}`;
    }

    async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: TripEntity[]; total: number }, RepositoryError>> {
        if (!this.config.enabled) return this.inner.findAll(params);
        return cacheAside(this.cache, this.key('findAll', JSON.stringify(params ?? {})), this.config.ttl.trip, () => this.inner.findAll(params), this.logger);
    }

    async findById(id: string): Promise<Result<TripEntity | null, RepositoryError>> {
        if (!this.config.enabled) return this.inner.findById(id);
        return cacheAside(this.cache, this.key('findById', id), this.config.ttl.trip, () => this.inner.findById(id), this.logger);
    }

    async findByFilters(filters: TripFilters): Promise<Result<TripEntity[], RepositoryError>> {
        if (!this.config.enabled) return this.inner.findByFilters(filters);
        return cacheAside(this.cache, this.key('findByFilters', JSON.stringify(filters)), this.config.ttl.trip, () => this.inner.findByFilters(filters), this.logger);
    }

    async create(data: CreateTripData): Promise<Result<TripEntity, RepositoryError>> {
        const result = await this.inner.create(data);
        if (this.config.enabled && result.success) {
            await invalidatePatterns(this.cache, this.config.keyPrefix, ['trip:*'], this.logger);
        }
        return result;
    }

    async delete(id: string): Promise<Result<void, RepositoryError>> {
        const result = await this.inner.delete(id);
        if (this.config.enabled && result.success) {
            await invalidatePatterns(this.cache, this.config.keyPrefix, ['trip:*', 'inscription:*'], this.logger);
        }
        return result;
    }
}
