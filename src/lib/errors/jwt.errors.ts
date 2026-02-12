/**
 * @module jwt.errors
 * Defines error classes for JWT operations (signing and verification).
 * These errors are returned within the Result pattern by JwtService implementations
 * and are mapped to appropriate HTTP status codes via the error registry.
 */

import { InfrastructureError } from './infrastructure.error.js';

/**
 * Base class for all JWT-related errors.
 * @extends InfrastructureError
 */
export class JwtError extends InfrastructureError {
	constructor(message: string, code: string, cause?: unknown) {
		super(message, code, cause);
		this.name = 'JwtError';
	}
}

/**
 * Thrown when a JWT token has passed its expiration time.
 * Maps to HTTP 401 Unauthorized.
 */
export class TokenExpiredError extends JwtError {
	constructor(cause?: unknown) {
		super('Token has expired', 'TOKEN_EXPIRED', cause);
		this.name = 'TokenExpiredError';
	}
}

/**
 * Thrown when a JWT token's signature verification fails.
 * Maps to HTTP 401 Unauthorized.
 */
export class TokenInvalidError extends JwtError {
	constructor(cause?: unknown) {
		super('Token is invalid', 'TOKEN_INVALID', cause);
		this.name = 'TokenInvalidError';
	}
}

/**
 * Thrown when a JWT token cannot be parsed (e.g. incorrect format).
 * Maps to HTTP 400 Bad Request.
 */
export class TokenMalformedError extends JwtError {
	constructor(cause?: unknown) {
		super('Token is malformed', 'TOKEN_MALFORMED', cause);
		this.name = 'TokenMalformedError';
	}
}

/**
 * Thrown when JWT token signing fails (e.g. missing secret).
 * Maps to HTTP 500 Internal Server Error.
 */
export class TokenSigningError extends JwtError {
	constructor(cause?: unknown) {
		super('Failed to sign token', 'TOKEN_SIGNING_FAILED', cause);
		this.name = 'TokenSigningError';
	}
}
