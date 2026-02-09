import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

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

export function updateContext(partial: Partial<RequestContext>): void {
	const current = asyncLocalStorage.getStore();
	if (current) {
		Object.assign(current, partial);
	}
}

export async function runWithContext<T>(
	context: Partial<RequestContext>,
	fn: () => Promise<T>,
): Promise<T> {
	const ctx = createContext(context);
	return asyncLocalStorage.run(ctx, fn);
}
