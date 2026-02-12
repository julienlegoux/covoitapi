/**
 * @module RequestContextTests
 *
 * Test suite for the AsyncLocalStorage-based request context system.
 * Covers request ID generation, context creation with defaults and overrides,
 * scoped context availability via runWithContext(), retrieval via getContext(),
 * mutation via updateContext(), and isolation between concurrent async contexts.
 */
import { describe, it, expect } from 'vitest';
import {
	createContext,
	getContext,
	updateContext,
	runWithContext,
	generateRequestId,
} from './request-context.js';

/** Tests for the full request context lifecycle: generation, creation, scoping, retrieval, and mutation. */
describe('RequestContext', () => {
	/** Tests for the generateRequestId() UUID factory function. */
	describe('generateRequestId()', () => {
		/** Validates that generateRequestId() returns a 36-character UUID string. */
		it('should generate a UUID', () => {
			const id = generateRequestId();
			expect(id).toBeDefined();
			expect(typeof id).toBe('string');
			expect(id.length).toBe(36);
		});

		/** Validates that successive calls produce distinct IDs (no collisions). */
		it('should generate unique IDs', () => {
			const id1 = generateRequestId();
			const id2 = generateRequestId();
			expect(id1).not.toBe(id2);
		});
	});

	/** Tests for the createContext() factory that builds a RequestContext object. */
	describe('createContext()', () => {
		/** Validates that createContext() auto-generates a 36-char requestId when none is provided. */
		it('should create context with generated requestId', () => {
			const ctx = createContext();
			expect(ctx.requestId).toBeDefined();
			expect(ctx.requestId.length).toBe(36);
		});

		/** Validates that partial overrides (requestId, userId) are applied to the new context. */
		it('should create context with provided partial values', () => {
			const ctx = createContext({
				requestId: 'custom-id',
				userId: 'user-123',
			});
			expect(ctx.requestId).toBe('custom-id');
			expect(ctx.userId).toBe('user-123');
		});

		/** Validates that the startTime field is populated as a numeric timestamp. */
		it('should set startTime', () => {
			const ctx = createContext();
			expect(ctx.startTime).toBeDefined();
			expect(typeof ctx.startTime).toBe('number');
		});

		/** Validates that the metadata bag is initialized as an empty object. */
		it('should initialize empty metadata', () => {
			const ctx = createContext();
			expect(ctx.metadata).toEqual({});
		});
	});

	/** Tests for runWithContext() which scopes a context to a callback via AsyncLocalStorage. */
	describe('runWithContext()', () => {
		/** Validates that getContext() returns the scoped context inside the callback. */
		it('should make context available inside callback', async () => {
			let capturedContext: ReturnType<typeof getContext>;

			await runWithContext({ requestId: 'test-id' }, async () => {
				capturedContext = getContext();
			});

			expect(capturedContext!).toBeDefined();
			expect(capturedContext!.requestId).toBe('test-id');
		});

		/** Validates that the callback's return value is propagated back to the caller. */
		it('should return callback result', async () => {
			const result = await runWithContext({}, async () => {
				return 'result-value';
			});

			expect(result).toBe('result-value');
		});

		/** Validates that two parallel runWithContext() calls maintain independent contexts (no bleed). */
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

	/** Tests for getContext() which retrieves the current request context from AsyncLocalStorage. */
	describe('getContext()', () => {
		/** Validates that getContext() returns undefined when called outside any context scope. */
		it('should return undefined outside context', () => {
			const ctx = getContext();
			expect(ctx).toBeUndefined();
		});

		/** Validates that getContext() retrieves the correct context inside a runWithContext() scope. */
		it('should return context inside runWithContext', async () => {
			await runWithContext({ requestId: 'inside-id' }, async () => {
				const ctx = getContext();
				expect(ctx).toBeDefined();
				expect(ctx!.requestId).toBe('inside-id');
			});
		});
	});

	/** Tests for updateContext() which mutates the current AsyncLocalStorage context in-place. */
	describe('updateContext()', () => {
		/** Validates that updateContext() modifies the value of an existing context field. */
		it('should update context values', async () => {
			await runWithContext({}, async () => {
				updateContext({ userId: 'updated-user' });
				expect(getContext()?.userId).toBe('updated-user');
			});
		});

		/** Validates that updateContext() merges new fields while preserving untouched fields. */
		it('should merge with existing context', async () => {
			await runWithContext({ requestId: 'original-req', userId: 'original-user' }, async () => {
				updateContext({ userId: 'new-user' });
				expect(getContext()?.requestId).toBe('original-req');
				expect(getContext()?.userId).toBe('new-user');
			});
		});

		/** Validates that updateContext() does not throw when called outside any context scope. */
		it('should do nothing outside context', () => {
			expect(() => updateContext({ userId: 'no-context' })).not.toThrow();
		});
	});
});
