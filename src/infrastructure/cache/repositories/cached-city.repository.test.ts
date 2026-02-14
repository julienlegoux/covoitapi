/**
 * @file Unit tests for CachedCityRepository.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { container } from 'tsyringe';
import { CachedCityRepository } from './cached-city.repository.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import {
    createMockCityRepository,
    createMockCacheService,
    createMockCacheConfig,
    createMockLogger,
} from '../../../../tests/setup.js';

describe('CachedCityRepository', () => {
    let repo: CachedCityRepository;
    let inner: ReturnType<typeof createMockCityRepository>;
    let cache: ReturnType<typeof createMockCacheService>;

    beforeEach(() => {
        container.clearInstances();
        inner = createMockCityRepository();
        cache = createMockCacheService();
        container.register(PRISMA_TOKENS.CityRepository, { useValue: inner });
        container.registerInstance(TOKENS.CacheService, cache);
        container.registerInstance(TOKENS.CacheConfig, createMockCacheConfig());
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repo = container.resolve(CachedCityRepository);
    });

    describe('findAll()', () => {
        it('should return cached data on hit', async () => {
            cache.get.mockResolvedValue({ __cached: true, data: { data: [], total: 0 } });
            await repo.findAll();
            expect(inner.findAll).not.toHaveBeenCalled();
        });

        it('should call inner on miss', async () => {
            cache.get.mockResolvedValue(null);
            inner.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
            await repo.findAll();
            expect(inner.findAll).toHaveBeenCalledOnce();
        });
    });

    describe('findByCityName()', () => {
        it('should use cache-aside', async () => {
            cache.get.mockResolvedValue(null);
            inner.findByCityName.mockResolvedValue(ok(null));
            await repo.findByCityName('Paris');
            expect(inner.findByCityName).toHaveBeenCalledWith('Paris');
        });
    });

    describe('create()', () => {
        it('should invalidate on success', async () => {
            inner.create.mockResolvedValue(ok({ id: '1', refId: 1, cityName: 'Paris', zipcode: '75000' }));
            await repo.create({ cityName: 'Paris', zipcode: '75000' });
            expect(cache.deleteByPattern).toHaveBeenCalled();
        });

        it('should NOT invalidate on failure', async () => {
            inner.create.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.create({ cityName: 'Paris', zipcode: '75000' });
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });

    describe('delete()', () => {
        it('should NOT invalidate on failure', async () => {
            inner.delete.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.delete('1');
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });
});
