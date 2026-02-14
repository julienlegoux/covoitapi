/**
 * @file Unit tests for CachedTripRepository.
 * Verifies cross-domain invalidation: trip.delete() → trip + inscription caches.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { container } from 'tsyringe';
import { CachedTripRepository } from './cached-trip.repository.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import {
    createMockTripRepository,
    createMockCacheService,
    createMockCacheConfig,
    createMockLogger,
} from '../../../../tests/setup.js';

describe('CachedTripRepository', () => {
    let repo: CachedTripRepository;
    let inner: ReturnType<typeof createMockTripRepository>;
    let cache: ReturnType<typeof createMockCacheService>;

    beforeEach(() => {
        container.clearInstances();
        inner = createMockTripRepository();
        cache = createMockCacheService();
        container.register(PRISMA_TOKENS.TripRepository, { useValue: inner });
        container.registerInstance(TOKENS.CacheService, cache);
        container.registerInstance(TOKENS.CacheConfig, createMockCacheConfig());
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repo = container.resolve(CachedTripRepository);
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
        it('should invalidate trip cache on success', async () => {
            inner.create.mockResolvedValue(ok({ id: 't1' }));
            await repo.create({ dateTrip: new Date(), kms: 100, seats: 3, driverRefId: 1, carRefId: 1 });
            // Only trip:*
            expect(cache.deleteByPattern).toHaveBeenCalledTimes(1);
        });

        it('should NOT invalidate on failure', async () => {
            inner.create.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.create({ dateTrip: new Date(), kms: 100, seats: 3, driverRefId: 1, carRefId: 1 });
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });

    describe('delete()', () => {
        it('should cross-invalidate trip AND inscription on success', async () => {
            inner.delete.mockResolvedValue(ok(undefined));
            await repo.delete('t1');
            // 2 patterns: trip:*, inscription:*
            expect(cache.deleteByPattern).toHaveBeenCalledTimes(2);
        });

        it('should NOT invalidate on failure', async () => {
            inner.delete.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.delete('t1');
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });
});
