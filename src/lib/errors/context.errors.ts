import { InfrastructureError } from './infrastructure.error.js';

export class ContextError extends InfrastructureError {
	constructor(message: string, code: string, cause?: unknown) {
		super(message, code, cause);
		this.name = 'ContextError';
	}
}

export class ContextNotFoundError extends ContextError {
	constructor() {
		super('Request context not found', 'CONTEXT_NOT_FOUND');
		this.name = 'ContextNotFoundError';
	}
}
