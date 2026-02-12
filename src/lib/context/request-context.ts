/**
 * @module request-context
 * Provides per-request context management using Node.js AsyncLocalStorage.
 * Each incoming HTTP request gets its own isolated context containing a unique
 * requestId, optional userId, timing information, and arbitrary metadata.
 * This context is automatically available to all code running within the request
 * scope, including the logger which enriches log entries with requestId and userId.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

/**
 * Per-request context stored in AsyncLocalStorage.
 *
 * @property requestId - Unique UUID identifying this request (for log correlation).
 * @property userId - The authenticated user's UUID (set after auth middleware runs).
 * @property startTime - High-resolution timestamp (via performance.now()) of request start.
 * @property metadata - Extensible key-value store for request-scoped data.
 */
export interface RequestContext {
	requestId: string;
	userId?: string;
	startTime: number;
	metadata: Record<string, unknown>;
}

/** AsyncLocalStorage instance that holds the per-request context. */
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Generates a new UUID v4 request identifier.
 * @returns A UUID string.
 */
export function generateRequestId(): string {
	return randomUUID();
}

/**
 * Creates a new RequestContext with defaults for missing fields.
 * @param partial - Optional partial context to merge with defaults.
 * @returns A fully populated RequestContext.
 */
export function createContext(partial?: Partial<RequestContext>): RequestContext {
	return {
		requestId: partial?.requestId ?? generateRequestId(),
		userId: partial?.userId,
		startTime: partial?.startTime ?? performance.now(),
		metadata: partial?.metadata ?? {},
	};
}

/**
 * Retrieves the current request context from AsyncLocalStorage.
 * Returns undefined if called outside of a request scope.
 * @returns The current RequestContext, or undefined.
 */
export function getContext(): RequestContext | undefined {
	return asyncLocalStorage.getStore();
}

/**
 * Updates the current request context by merging partial values.
 * No-op if called outside of a request scope.
 * @param partial - Partial context fields to merge into the current context.
 */
export function updateContext(partial: Partial<RequestContext>): void {
	const current = asyncLocalStorage.getStore();
	if (current) {
		Object.assign(current, partial);
	}
}

/**
 * Executes an async function within an isolated request context.
 * All code running within the callback (including nested async operations)
 * will have access to the created context via getContext().
 *
 * @param context - Partial context to initialize the request scope with.
 * @param fn - The async function to execute within the context.
 * @returns The return value of the executed function.
 */
export async function runWithContext<T>(
	context: Partial<RequestContext>,
	fn: () => Promise<T>,
): Promise<T> {
	const ctx = createContext(context);
	return asyncLocalStorage.run(ctx, fn);
}
