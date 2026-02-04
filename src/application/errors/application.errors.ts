import { ErrorCodes } from '../../infrastructure/errors/error-registry.js';

export class ApplicationError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly httpStatus: number = 400,
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
		super(message, ErrorCodes.VALIDATION_ERROR.code, ErrorCodes.VALIDATION_ERROR.httpStatus);
		this.name = 'ValidationError';
	}
}

export class NotFoundError extends ApplicationError {
	constructor(resource: string, identifier: string) {
		super(
			`${resource} not found: ${identifier}`,
			ErrorCodes.NOT_FOUND.code,
			ErrorCodes.NOT_FOUND.httpStatus,
		);
		this.name = 'NotFoundError';
	}
}
