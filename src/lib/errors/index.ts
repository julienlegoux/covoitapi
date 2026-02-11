// Domain errors

export { ContextError, ContextNotFoundError } from './context.errors.js';
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
export { EmailConfigError, EmailDeliveryError, EmailError } from './email.errors.js';
// Error types
export type { ErrorResponse } from './error.types.js';
export type { ErrorCode, ErrorDefinition } from './error-registry.js';
// Error registry
export {
	ErrorCodes,
	getErrorDefinition,
	getHttpStatus,
	isErrorCode,
} from './error-registry.js';
// Infrastructure errors
export { InfrastructureError } from './infrastructure.error.js';
export {
	JwtError,
	TokenExpiredError,
	TokenInvalidError,
	TokenMalformedError,
	TokenSigningError,
} from './jwt.errors.js';
export { HashingError, HashVerificationError, PasswordError } from './password.errors.js';
export { ConnectionError, DatabaseError, RepositoryError } from './repository.errors.js';
