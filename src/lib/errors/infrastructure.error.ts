/**
 * @module infrastructure.error
 * Defines the base error class for all infrastructure-level errors.
 * Infrastructure errors represent failures in external dependencies
 * (database, email, JWT, password hashing) as opposed to business logic violations.
 */

/**
 * Base class for all infrastructure-level errors.
 * Extended by RepositoryError, JwtError, PasswordError, EmailError, and ContextError.
 *
 * @extends Error
 * @property code - Machine-readable error code matching the ErrorCodes registry.
 * @property cause - The underlying error that triggered this infrastructure failure.
 */
export class InfrastructureError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly cause?: unknown,
	) {
		super(message);
		this.name = 'InfrastructureError';
	}
}
