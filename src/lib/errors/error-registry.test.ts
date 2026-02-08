import { describe, it, expect } from 'vitest';
import { ErrorCodes, getErrorDefinition, getHttpStatus, isErrorCode } from './error-registry.js';

describe('ErrorCodes', () => {
	it('should have all expected error codes defined', () => {
		expect(ErrorCodes.USER_ALREADY_EXISTS).toBeDefined();
		expect(ErrorCodes.INVALID_CREDENTIALS).toBeDefined();
		expect(ErrorCodes.USER_NOT_FOUND).toBeDefined();
		expect(ErrorCodes.DATABASE_ERROR).toBeDefined();
		expect(ErrorCodes.TOKEN_EXPIRED).toBeDefined();
		expect(ErrorCodes.INTERNAL_ERROR).toBeDefined();
	});

	it('should have correct HTTP statuses for domain errors', () => {
		expect(ErrorCodes.USER_ALREADY_EXISTS.httpStatus).toBe(409);
		expect(ErrorCodes.INVALID_CREDENTIALS.httpStatus).toBe(401);
		expect(ErrorCodes.USER_NOT_FOUND.httpStatus).toBe(404);
	});

	it('should have correct HTTP statuses for auth errors', () => {
		expect(ErrorCodes.UNAUTHORIZED.httpStatus).toBe(401);
		expect(ErrorCodes.FORBIDDEN.httpStatus).toBe(403);
		expect(ErrorCodes.TOKEN_EXPIRED.httpStatus).toBe(401);
		expect(ErrorCodes.TOKEN_INVALID.httpStatus).toBe(401);
		expect(ErrorCodes.TOKEN_MALFORMED.httpStatus).toBe(400);
	});

	it('should have correct HTTP statuses for infrastructure errors', () => {
		expect(ErrorCodes.DATABASE_ERROR.httpStatus).toBe(500);
		expect(ErrorCodes.CONNECTION_ERROR.httpStatus).toBe(500);
		expect(ErrorCodes.EXTERNAL_SERVICE_ERROR.httpStatus).toBe(502);
		expect(ErrorCodes.EMAIL_DELIVERY_FAILED.httpStatus).toBe(502);
		expect(ErrorCodes.HASHING_FAILED.httpStatus).toBe(500);
	});

	it('should have correct categories', () => {
		expect(ErrorCodes.USER_ALREADY_EXISTS.category).toBe('domain');
		expect(ErrorCodes.DATABASE_ERROR.category).toBe('infrastructure');
		expect(ErrorCodes.TOKEN_EXPIRED.category).toBe('auth');
		expect(ErrorCodes.INTERNAL_ERROR.category).toBe('system');
	});
});

describe('getErrorDefinition()', () => {
	it('should return correct definition for known codes', () => {
		const definition = getErrorDefinition('USER_ALREADY_EXISTS');
		expect(definition.code).toBe('USER_ALREADY_EXISTS');
		expect(definition.httpStatus).toBe(409);
		expect(definition.category).toBe('domain');
	});

	it('should return INTERNAL_ERROR for unknown codes', () => {
		const definition = getErrorDefinition('UNKNOWN_ERROR_CODE');
		expect(definition.code).toBe('INTERNAL_ERROR');
		expect(definition.httpStatus).toBe(500);
		expect(definition.category).toBe('system');
	});
});

describe('getHttpStatus()', () => {
	it('should return correct status for each error code', () => {
		expect(getHttpStatus('USER_ALREADY_EXISTS')).toBe(409);
		expect(getHttpStatus('INVALID_CREDENTIALS')).toBe(401);
		expect(getHttpStatus('USER_NOT_FOUND')).toBe(404);
		expect(getHttpStatus('DATABASE_ERROR')).toBe(500);
		expect(getHttpStatus('TOKEN_EXPIRED')).toBe(401);
	});

	it('should return 500 for unknown codes', () => {
		expect(getHttpStatus('COMPLETELY_UNKNOWN')).toBe(500);
	});
});

describe('isErrorCode()', () => {
	it('should return true for valid error codes', () => {
		expect(isErrorCode('USER_ALREADY_EXISTS')).toBe(true);
		expect(isErrorCode('INVALID_CREDENTIALS')).toBe(true);
		expect(isErrorCode('INTERNAL_ERROR')).toBe(true);
	});

	it('should return false for invalid codes', () => {
		expect(isErrorCode('NOT_A_REAL_CODE')).toBe(false);
		expect(isErrorCode('')).toBe(false);
		expect(isErrorCode('user_already_exists')).toBe(false); // case sensitive
	});
});
