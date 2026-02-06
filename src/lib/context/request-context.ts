import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { Result } from '../shared/types/result.js';
import { ok, err } from '../shared/types/result.js';
import { ContextNotFoundError } from '../../infrastructure/errors/context.errors.js';

export interface RequestContext {
	requestId: string;
	userId?: string;
	startTime: number;
	metadata: Record<string, unknown>;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function generateRequestId(): string {
	return randomUUID();
}

export function createContext(partial?: Partial<RequestContext>): RequestContext {
	return {
		requestId: partial?.requestId ?? generateRequestId(),
		userId: partial?.userId,
		startTime: partial?.startTime ?? performance.now(),
		metadata: partial?.metadata ?? {},
	};
}

export function getContext(): RequestContext | undefined {
	return asyncLocalStorage.getStore();
}

export function getContextSafe(): Result<RequestContext, ContextNotFoundError> {
	const ctx = asyncLocalStorage.getStore();
	return ctx ? ok(ctx) : err(new ContextNotFoundError());
}

export function getRequestId(): string | undefined {
	return asyncLocalStorage.getStore()?.requestId;
}

export function getUserId(): string | undefined {
	return asyncLocalStorage.getStore()?.userId;
}

export function updateContext(partial: Partial<RequestContext>): void {
	const current = asyncLocalStorage.getStore();
	if (current) {
		Object.assign(current, partial);
	}
}

export function setUserId(userId: string): void {
	updateContext({ userId });
}

export async function runWithContext<T>(
	context: Partial<RequestContext>,
	fn: () => Promise<T>,
): Promise<T> {
	const ctx = createContext(context);
	return asyncLocalStorage.run(ctx, fn);
}

export function runWithContextSync<T>(context: Partial<RequestContext>, fn: () => T): T {
	const ctx = createContext(context);
	return asyncLocalStorage.run(ctx, fn);
}
