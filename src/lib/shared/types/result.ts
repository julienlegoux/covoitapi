/**
 * Result type for railway-oriented programming
 * Represents either a success value or an error
 */
export type Result<T, E = Error> =
	| { readonly success: true; readonly value: T }
	| { readonly success: false; readonly error: E };

// ============================================================================
// Type Guards
// ============================================================================

export function isOk<T, E>(result: Result<T, E>): result is { success: true; value: T } {
	return result.success === true;
}

export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
	return result.success === false;
}

// ============================================================================
// Constructors
// ============================================================================

export function ok<T>(value: T): Result<T, never> {
	return { success: true, value };
}

export function err<E>(error: E): Result<never, E> {
	return { success: false, error };
}

// ============================================================================
// Transformers
// ============================================================================

/**
 * Transform the success value, leaving errors unchanged
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
	return result.success ? ok(fn(result.value)) : result;
}

/**
 * Transform the error, leaving success values unchanged
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
	return result.success ? result : err(fn(result.error));
}

/**
 * Chain operations that return Result (flatMap/bind)
 */
export function flatMap<T, U, E>(
	result: Result<T, E>,
	fn: (value: T) => Result<U, E>,
): Result<U, E> {
	return result.success ? fn(result.value) : result;
}

/**
 * Apply a function to both success and error paths
 */
export function fold<T, E, U>(
	result: Result<T, E>,
	onSuccess: (value: T) => U,
	onError: (error: E) => U,
): U {
	return result.success ? onSuccess(result.value) : onError(result.error);
}

// ============================================================================
// Async Transformers
// ============================================================================

/**
 * Transform the success value asynchronously
 */
export async function mapAsync<T, U, E>(
	result: Result<T, E>,
	fn: (value: T) => Promise<U>,
): Promise<Result<U, E>> {
	return result.success ? ok(await fn(result.value)) : result;
}

/**
 * Chain async operations that return Result
 */
export async function flatMapAsync<T, U, E>(
	result: Result<T, E>,
	fn: (value: T) => Promise<Result<U, E>>,
): Promise<Result<U, E>> {
	return result.success ? fn(result.value) : result;
}

// ============================================================================
// Unwrappers
// ============================================================================

/**
 * Extract the success value, throwing if error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
	if (result.success) {
		return result.value;
	}
	throw result.error instanceof Error ? result.error : new Error(String(result.error));
}

/**
 * Extract the success value, or return default
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
	return result.success ? result.value : defaultValue;
}

/**
 * Extract the success value, or compute from error
 */
export function unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
	return result.success ? result.value : fn(result.error);
}

/**
 * Extract the error value, throwing if success
 */
export function unwrapErr<T, E>(result: Result<T, E>): E {
	if (!result.success) {
		return result.error;
	}
	throw new Error('Called unwrapErr on an Ok value');
}

// ============================================================================
// Try-Catch Wrappers
// ============================================================================

/**
 * Wrap a function that may throw into a Result
 */
export function tryCatch<T>(fn: () => T): Result<T, Error> {
	try {
		return ok(fn());
	} catch (e) {
		return err(e instanceof Error ? e : new Error(String(e)));
	}
}

/**
 * Wrap an async function that may throw into a Result
 */
export async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
	try {
		return ok(await fn());
	} catch (e) {
		return err(e instanceof Error ? e : new Error(String(e)));
	}
}

// ============================================================================
// Combinators
// ============================================================================

/**
 * Combine multiple Results into a single Result with array of values
 * Short-circuits on first error
 */
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
	const values: T[] = [];
	for (const result of results) {
		if (!result.success) {
			return result;
		}
		values.push(result.value);
	}
	return ok(values);
}

/**
 * Collect all errors from Results (returns only errors)
 */
export function collectErrors<T, E>(results: Result<T, E>[]): E[] {
	return results.filter(isErr).map((r) => r.error);
}

/**
 * Collect all success values from Results
 */
export function collectValues<T, E>(results: Result<T, E>[]): T[] {
	return results.filter(isOk).map((r) => r.value);
}

/**
 * Partition Results into successes and errors
 */
export function partition<T, E>(results: Result<T, E>[]): { values: T[]; errors: E[] } {
	const values: T[] = [];
	const errors: E[] = [];
	for (const result of results) {
		if (result.success) {
			values.push(result.value);
		} else {
			errors.push(result.error);
		}
	}
	return { values, errors };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Convert a nullable value to Result
 */
export function fromNullable<T, E>(value: T | null | undefined, error: E): Result<T, E> {
	return value != null ? ok(value) : err(error);
}

/**
 * Convert a Result to a nullable value
 */
export function toNullable<T, E>(result: Result<T, E>): T | null {
	return result.success ? result.value : null;
}

/**
 * Execute side effect if success, return original result
 */
export function tap<T, E>(result: Result<T, E>, fn: (value: T) => void): Result<T, E> {
	if (result.success) {
		fn(result.value);
	}
	return result;
}

/**
 * Execute side effect if error, return original result
 */
export function tapErr<T, E>(result: Result<T, E>, fn: (error: E) => void): Result<T, E> {
	if (!result.success) {
		fn(result.error);
	}
	return result;
}
