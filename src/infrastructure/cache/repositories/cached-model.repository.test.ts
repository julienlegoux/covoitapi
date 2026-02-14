/**
 * @file Unit tests for CachedModelRepository.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { container } from 'tsyringe';
import { CachedModelRepository } from './cached-model.repository.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import {
    createMockModelRepository,
    createMockCacheService,
    createMockCacheConfig,
    createMockLogger,
} from '../../../../tests/setup.js';

describe('CachedModelRepository', () => {
    let repo: CachedModelRepository;
    let inner: ReturnType<typeof createMockModelRepository>;
    let cache: ReturnType<typeof createMockCacheService>;

    beforeEach(() => {
        container.clearInstances();
        inner = createMockModelRepository();
        cache = createMockCacheService();
        container.register(PRISMA_TOKENS.ModelRepository, { useValue: inner });
        container.registerInstance(TOKENS.CacheService, cache);
        container.registerInstance(TOKENS.CacheConfig, createMockCacheConfig());
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repo = container.resolve(CachedModelRepository);
    });

    describe('findAll()', () => {
        it('should use cache-aside', async () => {
            cache.get.mockResolvedValue(null);
            inner.findAll.mockResolvedValue(ok([]));
            await repo.findAll();
            expect(inner.findAll).toHaveBeenCalledOnce();
            expect(cache.set).toHaveBeenCalled();
        });
    });

    describe('findByNameAndBrand()', () => {
        it('should use cache-aside', async () => {
            cache.get.mockResolvedValue(null);
            inner.findByNameAndBrand.mockResolvedValue(ok(null));
            await repo.findByNameAndBrand('Civic', 1);
            expect(inner.findByNameAndBrand).toHaveBeenCalledWith('Civic', 1);
        });
    });

    describe('create()', () => {
        it('should invalidate on success', async () => {
            inner.create.mockResolvedValue(ok({ id: '1', refId: 1, name: 'Civic', brandRefId: 1 }));
            await repo.create({ name: 'Civic', brandRefId: 1 });
            expect(cache.deleteByPattern).toHaveBeenCalled();
        });

        it('should NOT invalidate on failure', async () => {
            inner.create.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.create({ name: 'Civic', brandRefId: 1 });
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });
});
