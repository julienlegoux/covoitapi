/**
 * @file Unit tests for CachedUserRepository.
 * Verifies cache-aside reads and guarded invalidation on writes.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { container } from 'tsyringe';
import { CachedUserRepository } from './cached-user.repository.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import {
    createMockUserRepository,
    createMockCacheService,
    createMockCacheConfig,
    createMockLogger,
} from '../../../../tests/setup.js';

describe('CachedUserRepository', () => {
    let repo: CachedUserRepository;
    let inner: ReturnType<typeof createMockUserRepository>;
    let cache: ReturnType<typeof createMockCacheService>;

    beforeEach(() => {
        container.clearInstances();
        inner = createMockUserRepository();
        cache = createMockCacheService();
        container.register(PRISMA_TOKENS.UserRepository, { useValue: inner });
        container.registerInstance(TOKENS.CacheService, cache);
        container.registerInstance(TOKENS.CacheConfig, createMockCacheConfig());
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repo = container.resolve(CachedUserRepository);
    });

    describe('findAll()', () => {
        it('should use cache-aside on cache miss', async () => {
            cache.get.mockResolvedValue(null);
            inner.findAll.mockResolvedValue(ok([]));
            const result = await repo.findAll();
            expect(result.success).toBe(true);
            expect(inner.findAll).toHaveBeenCalledOnce();
            expect(cache.set).toHaveBeenCalled();
        });

        it('should return cached data on cache hit', async () => {
            cache.get.mockResolvedValue({ __cached: true, data: [{ id: '1' }] });
            const result = await repo.findAll();
            expect(result.success).toBe(true);
            if (result.success) expect(result.value).toEqual([{ id: '1' }]);
            expect(inner.findAll).not.toHaveBeenCalled();
        });

        it('should bypass cache when disabled', async () => {
            container.clearInstances();
            container.register(PRISMA_TOKENS.UserRepository, { useValue: inner });
            container.registerInstance(TOKENS.CacheService, cache);
            container.registerInstance(TOKENS.CacheConfig, createMockCacheConfig({ enabled: false }));
            container.registerInstance(TOKENS.Logger, createMockLogger());
            repo = container.resolve(CachedUserRepository);

            inner.findAll.mockResolvedValue(ok([]));
            await repo.findAll();
            expect(cache.get).not.toHaveBeenCalled();
        });
    });

    describe('create()', () => {
        it('should invalidate user cache on success', async () => {
            inner.create.mockResolvedValue(ok({ id: '1' }));
            await repo.create({ firstName: 'J', lastName: 'D', phone: '06', authRefId: 1 });
            expect(cache.deleteByPattern).toHaveBeenCalled();
        });

        it('should NOT invalidate cache on failure', async () => {
            inner.create.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.create({ firstName: 'J', lastName: 'D', phone: '06', authRefId: 1 });
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });

    describe('update()', () => {
        it('should NOT invalidate cache on failure', async () => {
            inner.update.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.update('1', { firstName: 'X' });
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });

    describe('delete()', () => {
        it('should NOT invalidate cache on failure', async () => {
            inner.delete.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.delete('1');
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });

    describe('anonymize()', () => {
        it('should cross-invalidate user, auth, driver, inscription on success', async () => {
            inner.anonymize.mockResolvedValue(ok(undefined));
            await repo.anonymize('1');
            // 4 patterns: user:*, auth:*, driver:*, inscription:*
            expect(cache.deleteByPattern).toHaveBeenCalledTimes(4);
        });

        it('should NOT invalidate cache on failure', async () => {
            inner.anonymize.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.anonymize('1');
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });
});
