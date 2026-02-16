/**
 * @file Unit tests for CachedCarRepository.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { container } from 'tsyringe';
import { CachedCarRepository } from './cached-car.repository.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import {
    createMockCarRepository,
    createMockCacheService,
    createMockCacheConfig,
    createMockLogger,
} from '../../../../tests/setup.js';

describe('CachedCarRepository', () => {
    let repo: CachedCarRepository;
    let inner: ReturnType<typeof createMockCarRepository>;
    let cache: ReturnType<typeof createMockCacheService>;

    beforeEach(() => {
        container.clearInstances();
        inner = createMockCarRepository();
        cache = createMockCacheService();
        container.register(PRISMA_TOKENS.CarRepository, { useValue: inner });
        container.registerInstance(TOKENS.CacheService, cache);
        container.registerInstance(TOKENS.CacheConfig, createMockCacheConfig());
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repo = container.resolve(CachedCarRepository);
    });

    describe('findAll()', () => {
        it('should return cached data on hit', async () => {
            cache.get.mockResolvedValue({ __cached: true, data: { data: [], total: 0 } });
            const result = await repo.findAll();
            expect(result.success).toBe(true);
            expect(inner.findAll).not.toHaveBeenCalled();
        });

        it('should call inner on cache miss', async () => {
            cache.get.mockResolvedValue(null);
            inner.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
            await repo.findAll();
            expect(inner.findAll).toHaveBeenCalledOnce();
        });
    });

    describe('findById()', () => {
        it('should use cache-aside', async () => {
            cache.get.mockResolvedValue(null);
            inner.findById.mockResolvedValue(ok(null));
            await repo.findById('1');
            expect(inner.findById).toHaveBeenCalledWith('1');
        });
    });

    describe('existsByLicensePlate()', () => {
        it('should cache boolean result', async () => {
            cache.get.mockResolvedValue(null);
            inner.existsByLicensePlate.mockResolvedValue(ok(true));
            await repo.existsByLicensePlate('AB-123');
            expect(cache.set).toHaveBeenCalled();
        });
    });

    describe('create()', () => {
        it('should invalidate on success', async () => {
            inner.create.mockResolvedValue(ok({ id: '1' }));
            await repo.create({ licensePlate: 'AB-123', modelRefId: 1, driverRefId: 1 });
            expect(cache.deleteByPattern).toHaveBeenCalled();
        });

        it('should NOT invalidate on failure', async () => {
            inner.create.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.create({ licensePlate: 'AB-123', modelRefId: 1, driverRefId: 1 });
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });

    describe('update()', () => {
        it('should invalidate on success', async () => {
            inner.update.mockResolvedValue(ok({ id: '1' }));
            await repo.update('1', { licensePlate: 'XY-999' });
            expect(cache.deleteByPattern).toHaveBeenCalled();
        });

        it('should NOT invalidate on failure', async () => {
            inner.update.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.update('1', { licensePlate: 'XY-999' });
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
