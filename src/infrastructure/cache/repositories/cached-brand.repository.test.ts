/**
 * @file Unit tests for CachedBrandRepository.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { container } from 'tsyringe';
import { CachedBrandRepository } from './cached-brand.repository.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import {
    createMockBrandRepository,
    createMockCacheService,
    createMockCacheConfig,
    createMockLogger,
} from '../../../../tests/setup.js';

describe('CachedBrandRepository', () => {
    let repo: CachedBrandRepository;
    let inner: ReturnType<typeof createMockBrandRepository>;
    let cache: ReturnType<typeof createMockCacheService>;

    beforeEach(() => {
        container.clearInstances();
        inner = createMockBrandRepository();
        cache = createMockCacheService();
        container.register(PRISMA_TOKENS.BrandRepository, { useValue: inner });
        container.registerInstance(TOKENS.CacheService, cache);
        container.registerInstance(TOKENS.CacheConfig, createMockCacheConfig());
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repo = container.resolve(CachedBrandRepository);
    });

    describe('findAll()', () => {
        it('should use cache-aside on miss', async () => {
            cache.get.mockResolvedValue(null);
            inner.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
            const result = await repo.findAll();
            expect(result.success).toBe(true);
            expect(inner.findAll).toHaveBeenCalledOnce();
            expect(cache.set).toHaveBeenCalled();
        });

        it('should return cached data on hit', async () => {
            cache.get.mockResolvedValue({ __cached: true, data: { data: [], total: 0 } });
            await repo.findAll();
            expect(inner.findAll).not.toHaveBeenCalled();
        });
    });

    describe('create()', () => {
        it('should invalidate on success', async () => {
            inner.create.mockResolvedValue(ok({ id: '1', refId: 1, name: 'BMW' }));
            await repo.create({ name: 'BMW' });
            expect(cache.deleteByPattern).toHaveBeenCalled();
        });

        it('should NOT invalidate on failure', async () => {
            inner.create.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.create({ name: 'BMW' });
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });

    describe('delete()', () => {
        it('should invalidate on success', async () => {
            inner.delete.mockResolvedValue(ok(undefined));
            await repo.delete('1');
            expect(cache.deleteByPattern).toHaveBeenCalled();
        });

        it('should NOT invalidate on failure', async () => {
            inner.delete.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.delete('1');
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });
});
