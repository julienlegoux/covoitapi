import { ErrorCodes } from '../../infrastructure/errors/error-registry.js';

export class DomainError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly httpStatus: number = 400,
	) {
		super(message);
		this.name = 'DomainError';
	}
}

export class UserAlreadyExistsError extends DomainError {
	constructor(email: string) {
		super(
			`A user with email "${email}" already exists`,
			ErrorCodes.USER_ALREADY_EXISTS.code,
			ErrorCodes.USER_ALREADY_EXISTS.httpStatus,
		);
		this.name = 'UserAlreadyExistsError';
	}
}

export class InvalidCredentialsError extends DomainError {
	constructor() {
		super(
			'Invalid email or password',
			ErrorCodes.INVALID_CREDENTIALS.code,
			ErrorCodes.INVALID_CREDENTIALS.httpStatus,
		);
		this.name = 'InvalidCredentialsError';
	}
}

export class UserNotFoundError extends DomainError {
	constructor(identifier: string) {
		super(
			`User not found: ${identifier}`,
			ErrorCodes.USER_NOT_FOUND.code,
			ErrorCodes.USER_NOT_FOUND.httpStatus,
		);
		this.name = 'UserNotFoundError';
	}
}
