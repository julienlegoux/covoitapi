/**
 * @file Unit tests for cache.utils — cacheAside and invalidatePatterns helpers.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheAside, invalidatePatterns } from './cache.utils.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { createMockCacheService, createMockLogger } from '../../../tests/setup.js';

describe('cacheAside', () => {
    let cache: ReturnType<typeof createMockCacheService>;
    let logger: ReturnType<typeof createMockLogger>;

    beforeEach(() => {
        cache = createMockCacheService();
        logger = createMockLogger();
    });

    it('should return cached data on cache hit', async () => {
        cache.get.mockResolvedValue({ __cached: true, data: { id: '1' } });

        const source = vi.fn();
        const result = await cacheAside(cache, 'key', 300, source, logger);

        expect(result).toEqual({ success: true, value: { id: '1' } });
        expect(source).not.toHaveBeenCalled();
        expect(logger.debug).toHaveBeenCalledWith('Cache hit', { key: 'key' });
    });

    it('should call source on cache miss and cache the result', async () => {
        cache.get.mockResolvedValue(null);
        const source = vi.fn().mockResolvedValue(ok({ id: '1' }));

        const result = await cacheAside(cache, 'key', 300, source, logger);

        expect(result).toEqual({ success: true, value: { id: '1' } });
        expect(source).toHaveBeenCalledOnce();
        expect(cache.set).toHaveBeenCalledWith('key', { __cached: true, data: { id: '1' } }, 300);
    });

    it('should fall back to source on cache read error', async () => {
        cache.get.mockRejectedValue(new Error('Redis down'));
        const source = vi.fn().mockResolvedValue(ok('value'));

        const result = await cacheAside(cache, 'key', 300, source, logger);

        expect(result).toEqual({ success: true, value: 'value' });
        expect(source).toHaveBeenCalledOnce();
        expect(logger.warn).toHaveBeenCalledWith('Cache read failed, falling through to DB', expect.any(Object));
    });

    it('should NOT cache failed source results', async () => {
        cache.get.mockResolvedValue(null);
        const error = new Error('DB error');
        const source = vi.fn().mockResolvedValue(err(error));

        const result = await cacheAside(cache, 'key', 300, source, logger);

        expect(result).toEqual({ success: false, error });
        expect(cache.set).not.toHaveBeenCalled();
    });

    it('should handle cache write failure gracefully', async () => {
        cache.get.mockResolvedValue(null);
        cache.set.mockRejectedValue(new Error('Write failed'));
        const source = vi.fn().mockResolvedValue(ok('value'));

        const result = await cacheAside(cache, 'key', 300, source, logger);

        expect(result).toEqual({ success: true, value: 'value' });
        expect(logger.warn).toHaveBeenCalledWith('Cache write failed', expect.any(Object));
    });

    it('should handle cached null values correctly', async () => {
        cache.get.mockResolvedValue({ __cached: true, data: null });
        const source = vi.fn();

        const result = await cacheAside(cache, 'key', 300, source, logger);

        expect(result).toEqual({ success: true, value: null });
        expect(source).not.toHaveBeenCalled();
    });

    it('should not treat non-wrapper objects as cache hits', async () => {
        cache.get.mockResolvedValue({ someOther: 'data' });
        const source = vi.fn().mockResolvedValue(ok('value'));

        const result = await cacheAside(cache, 'key', 300, source, logger);

        expect(result).toEqual({ success: true, value: 'value' });
        expect(source).toHaveBeenCalledOnce();
    });
});

describe('invalidatePatterns', () => {
    let cache: ReturnType<typeof createMockCacheService>;
    let logger: ReturnType<typeof createMockLogger>;

    beforeEach(() => {
        cache = createMockCacheService();
        logger = createMockLogger();
    });

    it('should call deleteByPattern for each pattern with prefix', async () => {
        await invalidatePatterns(cache, 'test:', ['car:*', 'driver:*'], logger);

        expect(cache.deleteByPattern).toHaveBeenCalledTimes(2);
        expect(cache.deleteByPattern).toHaveBeenCalledWith('test:car:*');
        expect(cache.deleteByPattern).toHaveBeenCalledWith('test:driver:*');
    });

    it('should handle deleteByPattern error gracefully', async () => {
        cache.deleteByPattern.mockRejectedValueOnce(new Error('Redis error'));

        await invalidatePatterns(cache, 'test:', ['car:*', 'driver:*'], logger);

        expect(logger.warn).toHaveBeenCalledWith('Cache invalidation failed', expect.any(Object));
        // Second pattern should still be attempted
        expect(cache.deleteByPattern).toHaveBeenCalledTimes(2);
    });

    it('should handle empty patterns array', async () => {
        await invalidatePatterns(cache, 'test:', [], logger);

        expect(cache.deleteByPattern).not.toHaveBeenCalled();
    });
});
