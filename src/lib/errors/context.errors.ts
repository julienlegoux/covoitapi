/**
 * @module context.errors
 * Defines error classes for request context operations.
 * These errors occur when the AsyncLocalStorage-backed request context
 * is unavailable or corrupted during request processing.
 */

import { InfrastructureError } from './infrastructure.error.js';

/**
 * Base class for request context errors.
 * @extends InfrastructureError
 */
export class ContextError extends InfrastructureError {
	constructor(message: string, code: string, cause?: unknown) {
		super(message, code, cause);
		this.name = 'ContextError';
	}
}

/**
 * Thrown when attempting to access the request context outside of an active request scope.
 * This typically indicates that code is running outside the AsyncLocalStorage.run() callback.
 */
export class ContextNotFoundError extends ContextError {
	constructor() {
		super('Request context not found', 'CONTEXT_NOT_FOUND');
		this.name = 'ContextNotFoundError';
	}
}
