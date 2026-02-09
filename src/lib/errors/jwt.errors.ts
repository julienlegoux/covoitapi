import { InfrastructureError } from './infrastructure.error.js';

export class JwtError extends InfrastructureError {
	constructor(message: string, code: string, cause?: unknown) {
		super(message, code, cause);
		this.name = 'JwtError';
	}
}

export class TokenExpiredError extends JwtError {
	constructor(cause?: unknown) {
		super('Token has expired', 'TOKEN_EXPIRED', cause);
		this.name = 'TokenExpiredError';
	}
}

export class TokenInvalidError extends JwtError {
	constructor(cause?: unknown) {
		super('Token is invalid', 'TOKEN_INVALID', cause);
		this.name = 'TokenInvalidError';
	}
}

export class TokenMalformedError extends JwtError {
	constructor(cause?: unknown) {
		super('Token is malformed', 'TOKEN_MALFORMED', cause);
		this.name = 'TokenMalformedError';
	}
}

export class TokenSigningError extends JwtError {
	constructor(cause?: unknown) {
		super('Failed to sign token', 'TOKEN_SIGNING_FAILED', cause);
		this.name = 'TokenSigningError';
	}
}
