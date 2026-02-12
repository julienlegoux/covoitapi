/**
 * @module shared/types
 * Core shared types and constructors used throughout the application.
 * Defines the standard API response envelope and the simplified Result type
 * with ok/err constructors for railway-oriented programming.
 * For the full Result utility library (map, flatMap, unwrap, etc.), see result.ts.
 */

/**
 * Standard API response envelope used by all endpoints.
 * Wraps both success data and error information in a consistent structure.
 *
 * @template T - The type of the success data payload.
 * @property success - Whether the request succeeded.
 * @property data - The response data (present on success).
 * @property error - Error details (present on failure).
 */
export type ApiResponse<T = unknown> = {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: Record<string, string[]>;
	};
};

/**
 * Discriminated union representing either a success value or an error.
 * This is the simplified version; see result.ts for the full utility library.
 *
 * @template T - The success value type.
 * @template E - The error type (defaults to Error).
 */
export type Result<T, E = Error> = { success: true; value: T } | { success: false; error: E };

/**
 * Creates a successful Result containing the given value.
 * @param value - The success value.
 * @returns A Result with success: true.
 */
export function ok<T>(value: T): Result<T, never> {
	return { success: true, value };
}

/**
 * Creates a failed Result containing the given error.
 * @param error - The error value.
 * @returns A Result with success: false.
 */
export function err<E>(error: E): Result<never, E> {
	return { success: false, error };
}
