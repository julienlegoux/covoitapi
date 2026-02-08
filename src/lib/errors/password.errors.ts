import { InfrastructureError } from './infrastructure.error.js';

export class PasswordError extends InfrastructureError {
	constructor(message: string, code: string, cause?: unknown) {
		super(message, code, cause);
		this.name = 'PasswordError';
	}
}

export class HashingError extends PasswordError {
	constructor(cause?: unknown) {
		super('Failed to hash password', 'HASHING_FAILED', cause);
		this.name = 'HashingError';
	}
}

export class HashVerificationError extends PasswordError {
	constructor(cause?: unknown) {
		super('Failed to verify password hash', 'HASH_VERIFICATION_FAILED', cause);
		this.name = 'HashVerificationError';
	}
}
