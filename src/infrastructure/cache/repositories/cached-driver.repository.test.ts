/**
 * @file Unit tests for CachedDriverRepository.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { container } from 'tsyringe';
import { CachedDriverRepository } from './cached-driver.repository.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import {
    createMockDriverRepository,
    createMockCacheService,
    createMockCacheConfig,
    createMockLogger,
} from '../../../../tests/setup.js';

describe('CachedDriverRepository', () => {
    let repo: CachedDriverRepository;
    let inner: ReturnType<typeof createMockDriverRepository>;
    let cache: ReturnType<typeof createMockCacheService>;

    beforeEach(() => {
        container.clearInstances();
        inner = createMockDriverRepository();
        cache = createMockCacheService();
        container.register(PRISMA_TOKENS.DriverRepository, { useValue: inner });
        container.registerInstance(TOKENS.CacheService, cache);
        container.registerInstance(TOKENS.CacheConfig, createMockCacheConfig());
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repo = container.resolve(CachedDriverRepository);
    });

    describe('findByUserRefId()', () => {
        it('should return cached data on hit', async () => {
            cache.get.mockResolvedValue({ __cached: true, data: { id: 'd1' } });
            const result = await repo.findByUserRefId(1);
            expect(result.success).toBe(true);
            expect(inner.findByUserRefId).not.toHaveBeenCalled();
        });

        it('should call inner on miss', async () => {
            cache.get.mockResolvedValue(null);
            inner.findByUserRefId.mockResolvedValue(ok(null));
            await repo.findByUserRefId(1);
            expect(inner.findByUserRefId).toHaveBeenCalledWith(1);
        });
    });

    describe('create()', () => {
        it('should invalidate on success', async () => {
            inner.create.mockResolvedValue(ok({ id: 'd1' }));
            await repo.create({ driverLicense: 'DL-123', userRefId: 1 });
            expect(cache.deleteByPattern).toHaveBeenCalled();
        });

        it('should NOT invalidate on failure', async () => {
            inner.create.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.create({ driverLicense: 'DL-123', userRefId: 1 });
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });
});
