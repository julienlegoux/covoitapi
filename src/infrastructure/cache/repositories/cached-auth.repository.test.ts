/**
 * @file Unit tests for CachedAuthRepository.
 * Verifies that all auth reads bypass cache entirely, and write invalidation
 * only triggers on successful DB operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { CachedAuthRepository } from './cached-auth.repository.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import {
    createMockAuthRepository,
    createMockCacheService,
    createMockCacheConfig,
    createMockLogger,
} from '../../../../tests/setup.js';

describe('CachedAuthRepository', () => {
    let repo: CachedAuthRepository;
    let inner: ReturnType<typeof createMockAuthRepository>;
    let cache: ReturnType<typeof createMockCacheService>;

    beforeEach(() => {
        container.clearInstances();
        inner = createMockAuthRepository();
        cache = createMockCacheService();
        container.register(PRISMA_TOKENS.AuthRepository, { useValue: inner });
        container.registerInstance(TOKENS.CacheService, cache);
        container.registerInstance(TOKENS.CacheConfig, createMockCacheConfig());
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repo = container.resolve(CachedAuthRepository);
    });

    describe('findByEmail()', () => {
        it('should always call inner directly (no caching)', async () => {
            inner.findByEmail.mockResolvedValue(ok({ id: 'a1', email: 'a@b.com' }));
            const result = await repo.findByEmail('a@b.com');
            expect(result.success).toBe(true);
            expect(inner.findByEmail).toHaveBeenCalledWith('a@b.com');
            expect(cache.get).not.toHaveBeenCalled();
        });
    });

    describe('existsByEmail()', () => {
        it('should always call inner directly (no caching)', async () => {
            inner.existsByEmail.mockResolvedValue(ok(true));
            const result = await repo.existsByEmail('a@b.com');
            expect(result.success).toBe(true);
            expect(inner.existsByEmail).toHaveBeenCalledWith('a@b.com');
            expect(cache.get).not.toHaveBeenCalled();
        });
    });

    describe('createWithUser()', () => {
        it('should invalidate auth and user caches on success', async () => {
            inner.createWithUser.mockResolvedValue(ok({ auth: {}, user: {} }));
            await repo.createWithUser({ email: 'a@b.com', password: 'hash' }, { firstName: 'A', lastName: 'B', phone: '0600000000' });
            expect(cache.deleteByPattern).toHaveBeenCalledTimes(2);
        });

        it('should NOT invalidate cache on failure', async () => {
            inner.createWithUser.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.createWithUser({ email: 'a@b.com', password: 'hash' }, { firstName: 'A', lastName: 'B', phone: '0600000000' });
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });

    describe('updateRole()', () => {
        it('should invalidate auth cache on success', async () => {
            inner.updateRole.mockResolvedValue(ok(undefined));
            await repo.updateRole(1, 'ADMIN');
            expect(cache.deleteByPattern).toHaveBeenCalledTimes(1);
        });

        it('should NOT invalidate cache on failure', async () => {
            inner.updateRole.mockResolvedValue(err(new DatabaseError('fail')));
            await repo.updateRole(1, 'ADMIN');
            expect(cache.deleteByPattern).not.toHaveBeenCalled();
        });
    });
});
