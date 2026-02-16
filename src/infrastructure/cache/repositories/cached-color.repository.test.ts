/**
 * @file Unit tests for CachedColorRepository.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { container } from 'tsyringe';
import { CachedColorRepository } from './cached-color.repository.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import {
    createMockColorRepository,
    createMockCacheService,
    createMockCacheConfig,
    createMockLogger,
} from '../../../../tests/setup.js';

describe('CachedColorRepository', () => {
    let repo: CachedColorRepository;
    let inner: ReturnType<typeof createMockColorRepository>;
    let cache: ReturnType<typeof createMockCacheService>;

    beforeEach(() => {
        container.clearInstances();
        inner = createMockColorRepository();
        cache = createMockCacheService();
        container.register(PRISMA_TOKENS.ColorRepository, { useValue: inner });
        container.registerInstance(TOKENS.CacheService, cache);
        container.registerInstance(TOKENS.CacheConfig, createMockCacheConfig());
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repo = container.resolve(CachedColorRepository);
    });

    describe('findAll()', () => {
        it('should use cache-aside', async () => {
            cache.get.mockResolvedValue(null);
            inner.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
            await repo.findAll();
            expect(inner.findAll).toHaveBeenCalledOnce();
            expect(cache.set).toHaveBeenCalled();
        });
    });

    describe('findByName()', () => {
        it('should use cache-aside', async () => {
            cache.get.mockResolvedValue(null);
            inner.findByName.mockResolvedValue(ok(null));
            await repo.findByName('Red');
            expect(inner.findByName).toHaveBeenCalledWith('Red');
        });
    });

    describe('create()', () => {
        it('should invalidate on success', async () => {
            inner.create.mockResolvedValue(ok({ id: '1', refId: 1, name: 'Red', hex: '#FF0000' }));
            await repo.create({ name: 'Red', hex: '#FF0000' });
            expect(cache.deleteByPattern).toHaveBeenCalled();
        });

        it('should NOT invalidate on failure', async () => {
            inner.create.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.create({ name: 'Red', hex: '#FF0000' });
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });

    describe('update()', () => {
        it('should NOT invalidate on failure', async () => {
            inner.update.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.update('1', { name: 'Blue' });
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
