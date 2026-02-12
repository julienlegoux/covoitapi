/**
 * @module ErrorRegistryTests
 *
 * Test suite for the centralized error registry that maps application error
 * codes to HTTP statuses and categories. Covers the ErrorCodes constant map,
 * the getErrorDefinition() lookup with fallback, the getHttpStatus() shorthand,
 * and the isErrorCode() type guard for validating error code strings.
 */
import { describe, it, expect } from 'vitest';
import { ErrorCodes, getErrorDefinition, getHttpStatus, isErrorCode } from './error-registry.js';

/** Tests for the ErrorCodes constant map, verifying that all expected codes exist with correct HTTP statuses and categories. */
describe('ErrorCodes', () => {
	/** Validates that all essential error code entries are defined in the registry. */
	it('should have all expected error codes defined', () => {
		expect(ErrorCodes.USER_ALREADY_EXISTS).toBeDefined();
		expect(ErrorCodes.INVALID_CREDENTIALS).toBeDefined();
		expect(ErrorCodes.USER_NOT_FOUND).toBeDefined();
		expect(ErrorCodes.DATABASE_ERROR).toBeDefined();
		expect(ErrorCodes.TOKEN_EXPIRED).toBeDefined();
		expect(ErrorCodes.INTERNAL_ERROR).toBeDefined();
	});

	/** Validates HTTP status codes for domain-level errors (409 Conflict, 401 Unauthorized, 404 Not Found). */
	it('should have correct HTTP statuses for domain errors', () => {
		expect(ErrorCodes.USER_ALREADY_EXISTS.httpStatus).toBe(409);
		expect(ErrorCodes.INVALID_CREDENTIALS.httpStatus).toBe(401);
		expect(ErrorCodes.USER_NOT_FOUND.httpStatus).toBe(404);
	});

	/** Validates HTTP status codes for authentication/authorization errors (401, 403, 400). */
	it('should have correct HTTP statuses for auth errors', () => {
		expect(ErrorCodes.UNAUTHORIZED.httpStatus).toBe(401);
		expect(ErrorCodes.FORBIDDEN.httpStatus).toBe(403);
		expect(ErrorCodes.TOKEN_EXPIRED.httpStatus).toBe(401);
		expect(ErrorCodes.TOKEN_INVALID.httpStatus).toBe(401);
		expect(ErrorCodes.TOKEN_MALFORMED.httpStatus).toBe(400);
	});

	/** Validates HTTP status codes for infrastructure errors (500 Internal, 502 Bad Gateway). */
	it('should have correct HTTP statuses for infrastructure errors', () => {
		expect(ErrorCodes.DATABASE_ERROR.httpStatus).toBe(500);
		expect(ErrorCodes.CONNECTION_ERROR.httpStatus).toBe(500);
		expect(ErrorCodes.EXTERNAL_SERVICE_ERROR.httpStatus).toBe(502);
		expect(ErrorCodes.EMAIL_DELIVERY_FAILED.httpStatus).toBe(502);
		expect(ErrorCodes.HASHING_FAILED.httpStatus).toBe(500);
	});

	/** Validates that each error code is tagged with the correct category (domain, infrastructure, auth, system). */
	it('should have correct categories', () => {
		expect(ErrorCodes.USER_ALREADY_EXISTS.category).toBe('domain');
		expect(ErrorCodes.DATABASE_ERROR.category).toBe('infrastructure');
		expect(ErrorCodes.TOKEN_EXPIRED.category).toBe('auth');
		expect(ErrorCodes.INTERNAL_ERROR.category).toBe('system');
	});
});

/** Tests for getErrorDefinition() which looks up an error code and returns its full definition. */
describe('getErrorDefinition()', () => {
	/** Validates that a known error code returns the correct definition with code, httpStatus, and category. */
	it('should return correct definition for known codes', () => {
		const definition = getErrorDefinition('USER_ALREADY_EXISTS');
		expect(definition.code).toBe('USER_ALREADY_EXISTS');
		expect(definition.httpStatus).toBe(409);
		expect(definition.category).toBe('domain');
	});

	/** Validates that an unrecognized error code falls back to the INTERNAL_ERROR definition (500, system). */
	it('should return INTERNAL_ERROR for unknown codes', () => {
		const definition = getErrorDefinition('UNKNOWN_ERROR_CODE');
		expect(definition.code).toBe('INTERNAL_ERROR');
		expect(definition.httpStatus).toBe(500);
		expect(definition.category).toBe('system');
	});
});

/** Tests for getHttpStatus() which is a shorthand to retrieve just the HTTP status for a given error code. */
describe('getHttpStatus()', () => {
	/** Validates correct HTTP status mapping for several known error codes. */
	it('should return correct status for each error code', () => {
		expect(getHttpStatus('USER_ALREADY_EXISTS')).toBe(409);
		expect(getHttpStatus('INVALID_CREDENTIALS')).toBe(401);
		expect(getHttpStatus('USER_NOT_FOUND')).toBe(404);
		expect(getHttpStatus('DATABASE_ERROR')).toBe(500);
		expect(getHttpStatus('TOKEN_EXPIRED')).toBe(401);
	});

	/** Validates that an unrecognized code defaults to HTTP 500. */
	it('should return 500 for unknown codes', () => {
		expect(getHttpStatus('COMPLETELY_UNKNOWN')).toBe(500);
	});
});

/** Tests for isErrorCode() type guard that checks if a string is a registered error code. */
describe('isErrorCode()', () => {
	/** Validates that registered error code strings are recognized as valid. */
	it('should return true for valid error codes', () => {
		expect(isErrorCode('USER_ALREADY_EXISTS')).toBe(true);
		expect(isErrorCode('INVALID_CREDENTIALS')).toBe(true);
		expect(isErrorCode('INTERNAL_ERROR')).toBe(true);
	});

	/** Validates that unregistered strings, empty strings, and wrong-case variants return false. */
	it('should return false for invalid codes', () => {
		expect(isErrorCode('NOT_A_REAL_CODE')).toBe(false);
		expect(isErrorCode('')).toBe(false);
		expect(isErrorCode('user_already_exists')).toBe(false); // case sensitive
	});
});
