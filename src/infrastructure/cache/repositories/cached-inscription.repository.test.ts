/**
 * @file Unit tests for CachedInscriptionRepository.
 * Verifies cross-domain invalidation (inscription + travel).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { container } from 'tsyringe';
import { CachedInscriptionRepository } from './cached-inscription.repository.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import {
    createMockInscriptionRepository,
    createMockCacheService,
    createMockCacheConfig,
    createMockLogger,
} from '../../../../tests/setup.js';

describe('CachedInscriptionRepository', () => {
    let repo: CachedInscriptionRepository;
    let inner: ReturnType<typeof createMockInscriptionRepository>;
    let cache: ReturnType<typeof createMockCacheService>;

    beforeEach(() => {
        container.clearInstances();
        inner = createMockInscriptionRepository();
        cache = createMockCacheService();
        container.register(PRISMA_TOKENS.InscriptionRepository, { useValue: inner });
        container.registerInstance(TOKENS.CacheService, cache);
        container.registerInstance(TOKENS.CacheConfig, createMockCacheConfig());
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repo = container.resolve(CachedInscriptionRepository);
    });

    describe('findAll()', () => {
        it('should use cache-aside', async () => {
            cache.get.mockResolvedValue(null);
            inner.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
            await repo.findAll();
            expect(inner.findAll).toHaveBeenCalledOnce();
        });
    });

    describe('findByUserRefId()', () => {
        it('should use cache-aside', async () => {
            cache.get.mockResolvedValue(null);
            inner.findByUserRefId.mockResolvedValue(ok([]));
            await repo.findByUserRefId(1);
            expect(inner.findByUserRefId).toHaveBeenCalledWith(1);
        });
    });

    describe('existsByUserAndRoute()', () => {
        it('should cache boolean result', async () => {
            cache.get.mockResolvedValue(null);
            inner.existsByUserAndRoute.mockResolvedValue(ok(false));
            await repo.existsByUserAndRoute(1, 2);
            expect(cache.set).toHaveBeenCalled();
        });
    });

    describe('create()', () => {
        it('should cross-invalidate inscription and travel on success', async () => {
            inner.create.mockResolvedValue(ok({ id: 'i1' }));
            await repo.create({ userRefId: 1, routeRefId: 1 });
            // 2 patterns: inscription:*, travel:*
            expect(cache.deleteByPattern).toHaveBeenCalledTimes(2);
        });

        it('should NOT invalidate on failure', async () => {
            inner.create.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.create({ userRefId: 1, routeRefId: 1 });
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });

    describe('delete()', () => {
        it('should cross-invalidate inscription and travel on success', async () => {
            inner.delete.mockResolvedValue(ok(undefined));
            await repo.delete('i1');
            expect(cache.deleteByPattern).toHaveBeenCalledTimes(2);
        });

        it('should NOT invalidate on failure', async () => {
            inner.delete.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.delete('i1');
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });
});
