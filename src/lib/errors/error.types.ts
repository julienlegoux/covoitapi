/**
 * @module error.types
 * Defines the standard API error response shape.
 * All error responses from the API conform to this structure,
 * ensuring a consistent contract for clients.
 */

/**
 * Standard error response returned by API endpoints.
 *
 * @property success - Always false for error responses.
 * @property error.code - Machine-readable error code (e.g. "USER_NOT_FOUND").
 * @property error.message - Human-readable error description.
 * @property error.details - Optional field-level validation errors (field name to messages).
 */
export type ErrorResponse = {
	success: false;
	error: {
		code: string;
		message: string;
		details?: Record<string, string[]>;
	};
};
