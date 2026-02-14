/**
 * @file Unit tests for UpstashCacheService.
 * Uses mocked @upstash/redis to verify get, set, delete, deleteByPattern, isHealthy.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockLogger } from '../../../tests/setup.js';

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockDel = vi.fn();
const mockScan = vi.fn();
const mockPing = vi.fn();
const mockPipelineDel = vi.fn();
const mockPipelineExec = vi.fn();
const mockPipeline = vi.fn(() => ({
    del: mockPipelineDel,
    exec: mockPipelineExec,
}));

vi.mock('@upstash/redis', () => ({
    Redis: class MockRedis {
        get = mockGet;
        set = mockSet;
        del = mockDel;
        scan = mockScan;
        ping = mockPing;
        pipeline = mockPipeline;
    },
}));

const { UpstashCacheService } = await import('./upstash-cache.service.js');

describe('UpstashCacheService', () => {
    let service: InstanceType<typeof UpstashCacheService>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockPipelineExec.mockResolvedValue([]);
        process.env.UPSTASH_REDIS_REST_URL = 'https://fake.upstash.io';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
        service = new UpstashCacheService(createMockLogger());
    });

    describe('get()', () => {
        it('should return the cached value', async () => {
            mockGet.mockResolvedValue({ foo: 'bar' });

            const result = await service.get('key');

            expect(result).toEqual({ foo: 'bar' });
            expect(mockGet).toHaveBeenCalledWith('key');
        });

        it('should return null on cache miss', async () => {
            mockGet.mockResolvedValue(null);

            const result = await service.get('missing');

            expect(result).toBeNull();
        });

        it('should return null when redis returns undefined', async () => {
            mockGet.mockResolvedValue(undefined);

            const result = await service.get('missing');

            expect(result).toBeNull();
        });
    });

    describe('set()', () => {
        it('should set with EX TTL', async () => {
            await service.set('key', { data: 1 }, 600);

            expect(mockSet).toHaveBeenCalledWith('key', { data: 1 }, { ex: 600 });
        });
    });

    describe('delete()', () => {
        it('should delete the key', async () => {
            await service.delete('key');

            expect(mockDel).toHaveBeenCalledWith('key');
        });
    });

    describe('deleteByPattern()', () => {
        it('should scan and pipeline-delete matching keys', async () => {
            mockScan
                .mockResolvedValueOnce(['5', ['key:1', 'key:2']])
                .mockResolvedValueOnce(['0', ['key:3']]);

            await service.deleteByPattern('prefix:*');

            expect(mockScan).toHaveBeenCalledTimes(2);
            expect(mockPipelineDel).toHaveBeenCalledTimes(3);
            expect(mockPipelineExec).toHaveBeenCalledTimes(2);
        });

        it('should not pipeline when no keys match', async () => {
            mockScan.mockResolvedValue(['0', []]);

            await service.deleteByPattern('prefix:*');

            expect(mockPipeline).not.toHaveBeenCalled();
        });
    });

    describe('isHealthy()', () => {
        it('should return true when ping succeeds', async () => {
            mockPing.mockResolvedValue('PONG');

            expect(await service.isHealthy()).toBe(true);
        });

        it('should return false when ping fails', async () => {
            mockPing.mockRejectedValue(new Error('Connection refused'));

            expect(await service.isHealthy()).toBe(false);
        });

        it('should return false when ping returns unexpected value', async () => {
            mockPing.mockResolvedValue('WRONG');

            expect(await service.isHealthy()).toBe(false);
        });
    });
});
