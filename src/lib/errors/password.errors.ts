/**
 * @module password.errors
 * Defines error classes for password hashing and verification operations.
 * These errors are returned by PasswordService implementations (e.g. Argon2)
 * within the Result pattern.
 */

import { InfrastructureError } from './infrastructure.error.js';

/**
 * Base class for all password-related errors.
 * @extends InfrastructureError
 */
export class PasswordError extends InfrastructureError {
	constructor(message: string, code: string, cause?: unknown) {
		super(message, code, cause);
		this.name = 'PasswordError';
	}
}

/**
 * Thrown when password hashing fails (e.g. Argon2 internal error).
 * Maps to HTTP 500 Internal Server Error.
 */
export class HashingError extends PasswordError {
	constructor(cause?: unknown) {
		super('Failed to hash password', 'HASHING_FAILED', cause);
		this.name = 'HashingError';
	}
}

/**
 * Thrown when password hash verification fails (e.g. corrupted hash).
 * Note: This is NOT thrown for wrong passwords — a wrong password returns false.
 * Maps to HTTP 500 Internal Server Error.
 */
export class HashVerificationError extends PasswordError {
	constructor(cause?: unknown) {
		super('Failed to verify password hash', 'HASH_VERIFICATION_FAILED', cause);
		this.name = 'HashVerificationError';
	}
}
