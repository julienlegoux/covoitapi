import { describe, it, expect } from 'vitest';
import {
	createContext,
	getContext,
	updateContext,
	runWithContext,
	generateRequestId,
} from './request-context.js';

describe('RequestContext', () => {
	describe('generateRequestId()', () => {
		it('should generate a UUID', () => {
			const id = generateRequestId();
			expect(id).toBeDefined();
			expect(typeof id).toBe('string');
			expect(id.length).toBe(36);
		});

		it('should generate unique IDs', () => {
			const id1 = generateRequestId();
			const id2 = generateRequestId();
			expect(id1).not.toBe(id2);
		});
	});

	describe('createContext()', () => {
		it('should create context with generated requestId', () => {
			const ctx = createContext();
			expect(ctx.requestId).toBeDefined();
			expect(ctx.requestId.length).toBe(36);
		});

		it('should create context with provided partial values', () => {
			const ctx = createContext({
				requestId: 'custom-id',
				userId: 'user-123',
			});
			expect(ctx.requestId).toBe('custom-id');
			expect(ctx.userId).toBe('user-123');
		});

		it('should set startTime', () => {
			const ctx = createContext();
			expect(ctx.startTime).toBeDefined();
			expect(typeof ctx.startTime).toBe('number');
		});

		it('should initialize empty metadata', () => {
			const ctx = createContext();
			expect(ctx.metadata).toEqual({});
		});
	});

	describe('runWithContext()', () => {
		it('should make context available inside callback', async () => {
			let capturedContext: ReturnType<typeof getContext>;

			await runWithContext({ requestId: 'test-id' }, async () => {
				capturedContext = getContext();
			});

			expect(capturedContext!).toBeDefined();
			expect(capturedContext!.requestId).toBe('test-id');
		});

		it('should return callback result', async () => {
			const result = await runWithContext({}, async () => {
				return 'result-value';
			});

			expect(result).toBe('result-value');
		});

		it('should isolate context between parallel calls', async () => {
			const results = await Promise.all([
				runWithContext({ requestId: 'req-1' }, async () => {
					await new Promise((r) => setTimeout(r, 10));
					return getContext()?.requestId;
				}),
				runWithContext({ requestId: 'req-2' }, async () => {
					return getContext()?.requestId;
				}),
			]);

			expect(results[0]).toBe('req-1');
			expect(results[1]).toBe('req-2');
		});
	});

	describe('getContext()', () => {
		it('should return undefined outside context', () => {
			const ctx = getContext();
			expect(ctx).toBeUndefined();
		});

		it('should return context inside runWithContext', async () => {
			await runWithContext({ requestId: 'inside-id' }, async () => {
				const ctx = getContext();
				expect(ctx).toBeDefined();
				expect(ctx!.requestId).toBe('inside-id');
			});
		});
	});

	describe('updateContext()', () => {
		it('should update context values', async () => {
			await runWithContext({}, async () => {
				updateContext({ userId: 'updated-user' });
				expect(getContext()?.userId).toBe('updated-user');
			});
		});

		it('should merge with existing context', async () => {
			await runWithContext({ requestId: 'original-req', userId: 'original-user' }, async () => {
				updateContext({ userId: 'new-user' });
				expect(getContext()?.requestId).toBe('original-req');
				expect(getContext()?.userId).toBe('new-user');
			});
		});

		it('should do nothing outside context', () => {
			expect(() => updateContext({ userId: 'no-context' })).not.toThrow();
		});
	});
});
