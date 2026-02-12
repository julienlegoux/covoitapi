/**
 * @file Unit tests for the request-logger middleware.
 *
 * Verifies that the middleware sets the X-Request-Id header, logs
 * incoming requests and outgoing responses with timing info, and
 * properly calls next() to continue the middleware chain.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '../../lib/shared/di/tokens.js';
import { createMockLogger } from '../../../tests/setup.js';
import { requestLogger } from './request-logger.middleware.js';
import type { Context, Next } from 'hono';

function createMockContext(overrides?: Partial<{ method: string; path: string; query: Record<string, string>; userAgent: string }>): Context {
    const method = overrides?.method ?? 'GET';
    const path = overrides?.path ?? '/api/v1/test';
    const query = overrides?.query ?? {};
    const userAgent = overrides?.userAgent ?? 'vitest';

    const headers: Record<string, string> = {};
    const resHeaders: Record<string, string> = {};

    return {
        req: {
            method,
            path,
            query: vi.fn((name?: string) => name ? query[name] : query),
            header: vi.fn((name: string) => {
                if (name === 'user-agent') return userAgent;
                return undefined;
            }),
        },
        header: vi.fn((name: string, value: string) => {
            resHeaders[name] = value;
        }),
        res: { status: 200 },
        _resHeaders: resHeaders,
    } as unknown as Context & { _resHeaders: Record<string, string> };
}

describe('requestLogger middleware', () => {
    let mockLogger: ReturnType<typeof createMockLogger>;

    beforeEach(() => {
        mockLogger = createMockLogger();
        container.registerInstance(TOKENS.Logger, mockLogger);
    });

    it('should set X-Request-Id header with a UUID', async () => {
        const c = createMockContext() as Context & { _resHeaders: Record<string, string> };
        const next: Next = vi.fn().mockResolvedValue(undefined);

        await requestLogger(c, next);

        expect(c.header).toHaveBeenCalledWith('X-Request-Id', expect.stringMatching(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ));
    });

    it('should call next() to continue the middleware chain', async () => {
        const c = createMockContext();
        const next: Next = vi.fn().mockResolvedValue(undefined);

        await requestLogger(c, next);

        expect(next).toHaveBeenCalledOnce();
    });

    it('should log "Request received" with method, path, query, and user-agent', async () => {
        const c = createMockContext({
            method: 'POST',
            path: '/api/v1/travels',
            query: { page: '1' },
            userAgent: 'TestAgent/1.0',
        });
        const next: Next = vi.fn().mockResolvedValue(undefined);

        await requestLogger(c, next);

        expect(mockLogger.info).toHaveBeenCalledWith('Request received', expect.objectContaining({
            method: 'POST',
            path: '/api/v1/travels',
        }));
    });

    it('should log "Response sent" with method, path, status, and durationMs', async () => {
        const c = createMockContext({ method: 'GET', path: '/api/v1/brands' });
        const next: Next = vi.fn().mockResolvedValue(undefined);

        await requestLogger(c, next);

        expect(mockLogger.info).toHaveBeenCalledWith('Response sent', expect.objectContaining({
            method: 'GET',
            path: '/api/v1/brands',
            status: 200,
        }));
    });

    it('should log durationMs as a number', async () => {
        const c = createMockContext();
        const next: Next = vi.fn().mockResolvedValue(undefined);

        await requestLogger(c, next);

        const responseSentCall = mockLogger.info.mock.calls.find(
            (call: unknown[]) => call[0] === 'Response sent',
        );
        expect(responseSentCall).toBeDefined();
        expect(typeof responseSentCall![1].durationMs).toBe('number');
    });
});
