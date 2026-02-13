/**
 * @module errors
 * Public barrel export for all error classes, types, and the error registry.
 * Aggregates domain errors (business logic), infrastructure errors (external services),
 * and the error code registry that maps codes to HTTP statuses.
 */

// Cache errors
export { CacheConnectionError, CacheError, CacheOperationError } from './cache.errors.js';

// Context errors
export { ContextError, ContextNotFoundError } from './context.errors.js';

// Domain errors - Business logic violations
export {
	AlreadyInscribedError,
	BrandNotFoundError,
	CarAlreadyExistsError,
	CarNotFoundError,
	CityNotFoundError,
	ColorAlreadyExistsError,
	ColorNotFoundError,
	DomainError,
	DriverAlreadyExistsError,
	DriverNotFoundError,
	InscriptionNotFoundError,
	InvalidCredentialsError,
	NoSeatsAvailableError,
	TravelNotFoundError,
	UserAlreadyExistsError,
	UserNotFoundError,
} from './domain.errors.js';

// Email errors
export { EmailConfigError, EmailDeliveryError, EmailError } from './email.errors.js';

// Error types and registry
export type { ErrorResponse } from './error.types.js';
export type { ErrorCode, ErrorDefinition } from './error-registry.js';
export {
	ErrorCodes,
	getErrorDefinition,
	getHttpStatus,
	isErrorCode,
} from './error-registry.js';

// Infrastructure errors
export { InfrastructureError } from './infrastructure.error.js';

// JWT errors
export {
	JwtError,
	TokenExpiredError,
	TokenInvalidError,
	TokenMalformedError,
	TokenSigningError,
} from './jwt.errors.js';

// Password errors
export { HashingError, HashVerificationError, PasswordError } from './password.errors.js';

// Repository errors
export { ConnectionError, DatabaseError, RepositoryError } from './repository.errors.js';
