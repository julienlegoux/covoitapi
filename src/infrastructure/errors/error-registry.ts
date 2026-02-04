export interface ErrorDefinition {
	code: string;
	httpStatus: number;
	category: 'domain' | 'application' | 'infrastructure' | 'auth' | 'system';
}

export const ErrorCodes = {
	// Domain Errors - Business logic violations
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

	// Application Errors - Input/validation issues
	VALIDATION_ERROR: {
		code: 'VALIDATION_ERROR',
		httpStatus: 400,
		category: 'application',
	},
	NOT_FOUND: {
		code: 'NOT_FOUND',
		httpStatus: 404,
		category: 'application',
	},

	// Infrastructure Errors - External service failures
	DATABASE_ERROR: {
		code: 'DATABASE_ERROR',
		httpStatus: 500,
		category: 'infrastructure',
	},
	EXTERNAL_SERVICE_ERROR: {
		code: 'EXTERNAL_SERVICE_ERROR',
		httpStatus: 502,
		category: 'infrastructure',
	},

	// Auth Errors
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

	// System Errors
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
} as const satisfies Record<string, ErrorDefinition>;

export type ErrorCode = keyof typeof ErrorCodes;

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

export function getHttpStatus(code: string): number {
	return getErrorDefinition(code).httpStatus;
}

export function isErrorCode(code: string): code is ErrorCode {
	return code in ErrorCodes;
}
