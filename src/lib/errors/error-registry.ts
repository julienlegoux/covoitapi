/**
 * @module error-registry
 * Central registry mapping error codes to their HTTP status codes and categories.
 * This module provides the single source of truth for error-to-HTTP-status translation,
 * used by the result-response utility and error-handler middleware to produce
 * consistent API responses.
 */

/**
 * Defines the shape of an error code entry in the registry.
 *
 * @property code - The machine-readable error code string.
 * @property httpStatus - The HTTP status code to return for this error.
 * @property category - The error category for classification and logging.
 */
export interface ErrorDefinition {
	code: string;
	httpStatus: number;
	category: 'domain' | 'application' | 'infrastructure' | 'auth' | 'system';
}

/**
 * Exhaustive registry of all known error codes in the application.
 * Organized by category: domain (4xx), infrastructure (5xx), auth, and system errors.
 */
export const ErrorCodes = {
	// Domain Errors - Business logic violations (typically 4xx)
	USER_ALREADY_EXISTS: {
		code: 'USER_ALREADY_EXISTS',
		httpStatus: 409,
		category: 'domain',
	},
	INVALID_CREDENTIALS: {
		code: 'INVALID_CREDENTIALS',
		httpStatus: 401,
		category: 'domain',
	},
	USER_NOT_FOUND: {
		code: 'USER_NOT_FOUND',
		httpStatus: 404,
		category: 'domain',
	},
	BRAND_NOT_FOUND: {
		code: 'BRAND_NOT_FOUND',
		httpStatus: 404,
		category: 'domain',
	},
	CITY_NOT_FOUND: {
		code: 'CITY_NOT_FOUND',
		httpStatus: 404,
		category: 'domain',
	},
	CAR_NOT_FOUND: {
		code: 'CAR_NOT_FOUND',
		httpStatus: 404,
		category: 'domain',
	},
	CAR_ALREADY_EXISTS: {
		code: 'CAR_ALREADY_EXISTS',
		httpStatus: 409,
		category: 'domain',
	},
	DRIVER_NOT_FOUND: {
		code: 'DRIVER_NOT_FOUND',
		httpStatus: 404,
		category: 'domain',
	},
	DRIVER_ALREADY_EXISTS: {
		code: 'DRIVER_ALREADY_EXISTS',
		httpStatus: 409,
		category: 'domain',
	},
	TRAVEL_NOT_FOUND: {
		code: 'TRAVEL_NOT_FOUND',
		httpStatus: 404,
		category: 'domain',
	},
	/** @deprecated Use TRAVEL_NOT_FOUND instead. Kept for backward compatibility. */
	ROUTE_NOT_FOUND: {
		code: 'ROUTE_NOT_FOUND',
		httpStatus: 404,
		category: 'domain',
	},
	INSCRIPTION_NOT_FOUND: {
		code: 'INSCRIPTION_NOT_FOUND',
		httpStatus: 404,
		category: 'domain',
	},
	ALREADY_INSCRIBED: {
		code: 'ALREADY_INSCRIBED',
		httpStatus: 409,
		category: 'domain',
	},
	NO_SEATS_AVAILABLE: {
		code: 'NO_SEATS_AVAILABLE',
		httpStatus: 400,
		category: 'domain',
	},
	COLOR_NOT_FOUND: {
		code: 'COLOR_NOT_FOUND',
		httpStatus: 404,
		category: 'domain',
	},
	COLOR_ALREADY_EXISTS: {
		code: 'COLOR_ALREADY_EXISTS',
		httpStatus: 409,
		category: 'domain',
	},
	RELATION_CONSTRAINT: {
		code: 'RELATION_CONSTRAINT',
		httpStatus: 409,
		category: 'infrastructure',
	},

	// Infrastructure Errors - External service failures (typically 5xx)
	DATABASE_ERROR: {
		code: 'DATABASE_ERROR',
		httpStatus: 500,
		category: 'infrastructure',
	},
	CONNECTION_ERROR: {
		code: 'CONNECTION_ERROR',
		httpStatus: 500,
		category: 'infrastructure',
	},
	EXTERNAL_SERVICE_ERROR: {
		code: 'EXTERNAL_SERVICE_ERROR',
		httpStatus: 502,
		category: 'infrastructure',
	},
	EMAIL_DELIVERY_FAILED: {
		code: 'EMAIL_DELIVERY_FAILED',
		httpStatus: 502,
		category: 'infrastructure',
	},
	EMAIL_CONFIG_ERROR: {
		code: 'EMAIL_CONFIG_ERROR',
		httpStatus: 500,
		category: 'infrastructure',
	},
	HASHING_FAILED: {
		code: 'HASHING_FAILED',
		httpStatus: 500,
		category: 'infrastructure',
	},
	HASH_VERIFICATION_FAILED: {
		code: 'HASH_VERIFICATION_FAILED',
		httpStatus: 500,
		category: 'infrastructure',
	},

	// Auth Errors - Authentication and authorization failures
	UNAUTHORIZED: {
		code: 'UNAUTHORIZED',
		httpStatus: 401,
		category: 'auth',
	},
	FORBIDDEN: {
		code: 'FORBIDDEN',
		httpStatus: 403,
		category: 'auth',
	},
	TOKEN_EXPIRED: {
		code: 'TOKEN_EXPIRED',
		httpStatus: 401,
		category: 'auth',
	},
	TOKEN_INVALID: {
		code: 'TOKEN_INVALID',
		httpStatus: 401,
		category: 'auth',
	},
	TOKEN_MALFORMED: {
		code: 'TOKEN_MALFORMED',
		httpStatus: 400,
		category: 'auth',
	},
	TOKEN_SIGNING_FAILED: {
		code: 'TOKEN_SIGNING_FAILED',
		httpStatus: 500,
		category: 'infrastructure',
	},

	// System Errors - Internal/unexpected failures
	INTERNAL_ERROR: {
		code: 'INTERNAL_ERROR',
		httpStatus: 500,
		category: 'system',
	},
	SERVICE_UNAVAILABLE: {
		code: 'SERVICE_UNAVAILABLE',
		httpStatus: 503,
		category: 'system',
	},
	CONTEXT_NOT_FOUND: {
		code: 'CONTEXT_NOT_FOUND',
		httpStatus: 500,
		category: 'system',
	},
} as const satisfies Record<string, ErrorDefinition>;

/** Union type of all registered error code names. */
export type ErrorCode = keyof typeof ErrorCodes;

/**
 * Looks up the error definition for a given error code.
 * Falls back to INTERNAL_ERROR (500) if the code is unrecognized.
 *
 * @param code - The error code string to look up.
 * @returns The matching ErrorDefinition, or a default INTERNAL_ERROR definition.
 */
export function getErrorDefinition(code: string): ErrorDefinition {
	const definition = ErrorCodes[code as ErrorCode];
	return (
		definition ?? {
			code: 'INTERNAL_ERROR',
			httpStatus: 500,
			category: 'system',
		}
	);
}

/**
 * Retrieves the HTTP status code for a given error code.
 * Shorthand for `getErrorDefinition(code).httpStatus`.
 *
 * @param code - The error code string to look up.
 * @returns The corresponding HTTP status code.
 */
export function getHttpStatus(code: string): number {
	return getErrorDefinition(code).httpStatus;
}

/**
 * Type guard that checks if a string is a valid registered error code.
 *
 * @param code - The string to check.
 * @returns True if the code exists in the ErrorCodes registry.
 */
export function isErrorCode(code: string): code is ErrorCode {
	return code in ErrorCodes;
}
