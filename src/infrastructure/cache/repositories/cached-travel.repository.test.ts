/**
 * @file Unit tests for CachedTravelRepository.
 * Verifies cross-domain invalidation: travel.delete() → travel + inscription caches.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { container } from 'tsyringe';
import { CachedTravelRepository } from './cached-travel.repository.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import {
    createMockTravelRepository,
    createMockCacheService,
    createMockCacheConfig,
    createMockLogger,
} from '../../../../tests/setup.js';

describe('CachedTravelRepository', () => {
    let repo: CachedTravelRepository;
    let inner: ReturnType<typeof createMockTravelRepository>;
    let cache: ReturnType<typeof createMockCacheService>;

    beforeEach(() => {
        container.clearInstances();
        inner = createMockTravelRepository();
        cache = createMockCacheService();
        container.register(PRISMA_TOKENS.TravelRepository, { useValue: inner });
        container.registerInstance(TOKENS.CacheService, cache);
        container.registerInstance(TOKENS.CacheConfig, createMockCacheConfig());
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repo = container.resolve(CachedTravelRepository);
    });

    describe('findAll()', () => {
        it('should use cache-aside', async () => {
            cache.get.mockResolvedValue(null);
            inner.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
            await repo.findAll();
            expect(inner.findAll).toHaveBeenCalledOnce();
        });
    });

    describe('findByFilters()', () => {
        it('should use cache-aside', async () => {
            cache.get.mockResolvedValue(null);
            inner.findByFilters.mockResolvedValue(ok([]));
            await repo.findByFilters({});
            expect(inner.findByFilters).toHaveBeenCalled();
        });
    });

    describe('create()', () => {
        it('should invalidate travel cache on success', async () => {
            inner.create.mockResolvedValue(ok({ id: 't1' }));
            await repo.create({ dateRoute: new Date(), kms: 100, seats: 3, driverRefId: 1, carRefId: 1 });
            // Only travel:*
            expect(cache.deleteByPattern).toHaveBeenCalledTimes(1);
        });

        it('should NOT invalidate on failure', async () => {
            inner.create.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.create({ dateRoute: new Date(), kms: 100, seats: 3, driverRefId: 1, carRefId: 1 });
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });

    describe('delete()', () => {
        it('should cross-invalidate travel AND inscription on success', async () => {
            inner.delete.mockResolvedValue(ok(undefined));
            await repo.delete('t1');
            // 2 patterns: travel:*, inscription:*
            expect(cache.deleteByPattern).toHaveBeenCalledTimes(2);
        });

        it('should NOT invalidate on failure', async () => {
            inner.delete.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.delete('t1');
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });
});
