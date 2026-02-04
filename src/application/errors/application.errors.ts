export class ApplicationError extends Error {
	constructor(
		message: string,
		public readonly code: string,
	) {
		super(message);
		this.name = 'ApplicationError';
	}
}

export class ValidationError extends ApplicationError {
	constructor(
		message: string,
		public readonly details?: Record<string, string[]>,
	) {
		super(message, 'VALIDATION_ERROR');
		this.name = 'ValidationError';
	}
}

export class NotFoundError extends ApplicationError {
	constructor(resource: string, identifier: string) {
		super(`${resource} not found: ${identifier}`, 'NOT_FOUND');
		this.name = 'NotFoundError';
	}
}
