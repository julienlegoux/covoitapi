/**
 * @module ResultUtilitiesTests
 *
 * Test suite for the Rust-inspired Result<T, E> monad utilities.
 * Covers constructors (ok/err), type guards (isOk/isErr), synchronous and
 * asynchronous transformers (map, mapErr, flatMap, fold, mapAsync, flatMapAsync),
 * unwrap helpers, try-catch wrappers, combinators (combine, collectErrors,
 * collectValues, partition), and nullable conversion utilities (fromNullable,
 * toNullable, tap, tapErr).
 */
import { describe, it, expect } from 'vitest';
import {
	ok,
	err,
	isOk,
	isErr,
	map,
	mapErr,
	flatMap,
	fold,
	mapAsync,
	flatMapAsync,
	unwrap,
	unwrapOr,
	unwrapOrElse,
	unwrapErr,
	tryCatch,
	tryCatchAsync,
	combine,
	collectErrors,
	collectValues,
	partition,
	fromNullable,
	toNullable,
	tap,
	tapErr,
	type Result,
} from './result.js';

/** Tests for all Result utility functions grouped by category. */
describe('Result utilities', () => {
	/** Tests for the ok() and err() constructor functions. */
	describe('constructors', () => {
		/** Validates that ok() produces a Result with success=true and the given value. */
		it('ok() should create success result', () => {
			const result = ok(42);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBe(42);
			}
		});

		/** Validates that err() produces a Result with success=false and the given error. */
		it('err() should create failure result', () => {
			const result = err('error message');
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe('error message');
			}
		});
	});

	/** Tests for the isOk() and isErr() type guard functions. */
	describe('type guards', () => {
		/** Validates that isOk() returns true when given a success Result. */
		it('isOk() should return true for success', () => {
			const result = ok(42);
			expect(isOk(result)).toBe(true);
		});

		/** Validates that isOk() returns false when given a failure Result. */
		it('isOk() should return false for failure', () => {
			const result = err('error');
			expect(isOk(result)).toBe(false);
		});

		/** Validates that isErr() returns true when given a failure Result. */
		it('isErr() should return true for failure', () => {
			const result = err('error');
			expect(isErr(result)).toBe(true);
		});

		/** Validates that isErr() returns false when given a success Result. */
		it('isErr() should return false for success', () => {
			const result = ok(42);
			expect(isErr(result)).toBe(false);
		});
	});

	/** Tests for synchronous transformation functions: map, mapErr, flatMap, fold. */
	describe('transformers', () => {
		/** Validates that map() applies the function to the value inside a success Result. */
		it('map() should transform success value', () => {
			const result = ok(5);
			const mapped = map(result, (x) => x * 2);
			expect(mapped.success).toBe(true);
			if (mapped.success) {
				expect(mapped.value).toBe(10);
			}
		});

		/** Validates that map() leaves an error Result unchanged (short-circuits). */
		it('map() should pass through error', () => {
			const result: Result<number, string> = err('error');
			const mapped = map(result, (x) => x * 2);
			expect(mapped.success).toBe(false);
			if (!mapped.success) {
				expect(mapped.error).toBe('error');
			}
		});

		/** Validates that mapErr() applies the function to the error inside a failure Result. */
		it('mapErr() should transform error', () => {
			const result: Result<number, string> = err('error');
			const mapped = mapErr(result, (e) => e.toUpperCase());
			expect(mapped.success).toBe(false);
			if (!mapped.success) {
				expect(mapped.error).toBe('ERROR');
			}
		});

		/** Validates that mapErr() leaves a success Result unchanged. */
		it('mapErr() should pass through success', () => {
			const result: Result<number, string> = ok(42);
			const mapped = mapErr(result, (e) => e.toUpperCase());
			expect(mapped.success).toBe(true);
			if (mapped.success) {
				expect(mapped.value).toBe(42);
			}
		});

		/** Validates that flatMap() chains a Result-returning function on success. */
		it('flatMap() should chain operations', () => {
			const result = ok(5);
			const chained = flatMap(result, (x) => ok(x * 2));
			expect(chained.success).toBe(true);
			if (chained.success) {
				expect(chained.value).toBe(10);
			}
		});

		/** Validates that flatMap() short-circuits and preserves the original error on failure. */
		it('flatMap() should short-circuit on error', () => {
			const result: Result<number, string> = err('first error');
			const chained = flatMap(result, (x) => ok(x * 2));
			expect(chained.success).toBe(false);
			if (!chained.success) {
				expect(chained.error).toBe('first error');
			}
		});

		/** Validates that fold() invokes the success handler when the Result is ok. */
		it('fold() should apply success handler', () => {
			const result = ok(5);
			const folded = fold(
				result,
				(x) => `success: ${x}`,
				(e) => `error: ${e}`,
			);
			expect(folded).toBe('success: 5');
		});

		/** Validates that fold() invokes the error handler when the Result is err. */
		it('fold() should apply error handler', () => {
			const result: Result<number, string> = err('failed');
			const folded = fold(
				result,
				(x) => `success: ${x}`,
				(e) => `error: ${e}`,
			);
			expect(folded).toBe('error: failed');
		});
	});

	/** Tests for asynchronous transformation functions: mapAsync, flatMapAsync. */
	describe('async transformers', () => {
		/** Validates that mapAsync() applies an async function to the value inside a success Result. */
		it('mapAsync() should transform success value asynchronously', async () => {
			const result = ok(5);
			const mapped = await mapAsync(result, async (x) => x * 2);
			expect(mapped.success).toBe(true);
			if (mapped.success) {
				expect(mapped.value).toBe(10);
			}
		});

		/** Validates that flatMapAsync() chains an async Result-returning function on success. */
		it('flatMapAsync() should chain async operations', async () => {
			const result = ok(5);
			const chained = await flatMapAsync(result, async (x) => ok(x * 2));
			expect(chained.success).toBe(true);
			if (chained.success) {
				expect(chained.value).toBe(10);
			}
		});
	});

	/** Tests for unwrap helpers: unwrap, unwrapOr, unwrapOrElse, unwrapErr. */
	describe('unwrappers', () => {
		/** Validates that unwrap() extracts the value from a success Result. */
		it('unwrap() should return value on success', () => {
			const result = ok(42);
			expect(unwrap(result)).toBe(42);
		});

		/** Validates that unwrap() throws an error when called on a failure Result. */
		it('unwrap() should throw on error', () => {
			const result = err(new Error('test error'));
			expect(() => unwrap(result)).toThrow('test error');
		});

		/** Validates that unwrapOr() returns the inner value when the Result is ok. */
		it('unwrapOr() should return value on success', () => {
			const result = ok(42);
			expect(unwrapOr(result, 0)).toBe(42);
		});

		/** Validates that unwrapOr() returns the provided default when the Result is err. */
		it('unwrapOr() should return default on error', () => {
			const result: Result<number, string> = err('error');
			expect(unwrapOr(result, 0)).toBe(0);
		});

		/** Validates that unwrapOrElse() computes the fallback from the error value. */
		it('unwrapOrElse() should compute from error', () => {
			const result: Result<number, string> = err('error');
			expect(unwrapOrElse(result, (e) => e.length)).toBe(5);
		});

		/** Validates that unwrapErr() extracts the error from a failure Result. */
		it('unwrapErr() should return error on failure', () => {
			const result = err('test error');
			expect(unwrapErr(result)).toBe('test error');
		});

		/** Validates that unwrapErr() throws when called on a success Result. */
		it('unwrapErr() should throw on success', () => {
			const result = ok(42);
			expect(() => unwrapErr(result)).toThrow('Called unwrapErr on an Ok value');
		});
	});

	/** Tests for tryCatch() and tryCatchAsync() wrappers that convert thrown exceptions into Result. */
	describe('try-catch wrappers', () => {
		/** Validates that tryCatch() catches a synchronous exception and returns err. */
		it('tryCatch() should catch sync exceptions', () => {
			const result = tryCatch(() => {
				throw new Error('sync error');
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toBe('sync error');
			}
		});

		/** Validates that tryCatch() returns ok when the function succeeds without throwing. */
		it('tryCatch() should return ok for successful sync', () => {
			const result = tryCatch(() => 42);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBe(42);
			}
		});

		/** Validates that tryCatchAsync() catches a rejected promise and returns err. */
		it('tryCatchAsync() should catch async exceptions', async () => {
			const result = await tryCatchAsync(async () => {
				throw new Error('async error');
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toBe('async error');
			}
		});

		/** Validates that tryCatchAsync() returns ok when the async function resolves successfully. */
		it('tryCatchAsync() should return ok for successful async', async () => {
			const result = await tryCatchAsync(async () => 42);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBe(42);
			}
		});
	});

	/** Tests for combinators that operate on arrays of Results: combine, collectErrors, collectValues, partition. */
	describe('combinators', () => {
		/** Validates that combine() merges an array of ok Results into a single ok with all values. */
		it('combine() should combine array of results', () => {
			const results = [ok(1), ok(2), ok(3)];
			const combined = combine(results);
			expect(combined.success).toBe(true);
			if (combined.success) {
				expect(combined.value).toEqual([1, 2, 3]);
			}
		});

		/** Validates that combine() short-circuits on the first err in the array. */
		it('combine() should short-circuit on first error', () => {
			const results: Result<number, string>[] = [ok(1), err('error'), ok(3)];
			const combined = combine(results);
			expect(combined.success).toBe(false);
			if (!combined.success) {
				expect(combined.error).toBe('error');
			}
		});

		/** Validates that collectErrors() extracts only the error values from a mixed array. */
		it('collectErrors() should extract all errors', () => {
			const results: Result<number, string>[] = [ok(1), err('e1'), ok(2), err('e2')];
			const errors = collectErrors(results);
			expect(errors).toEqual(['e1', 'e2']);
		});

		/** Validates that collectValues() extracts only the success values from a mixed array. */
		it('collectValues() should extract all values', () => {
			const results: Result<number, string>[] = [ok(1), err('e1'), ok(2), err('e2')];
			const values = collectValues(results);
			expect(values).toEqual([1, 2]);
		});

		/** Validates that partition() separates a mixed array into values and errors. */
		it('partition() should separate values and errors', () => {
			const results: Result<number, string>[] = [ok(1), err('e1'), ok(2), err('e2')];
			const partitioned = partition(results);
			expect(partitioned.values).toEqual([1, 2]);
			expect(partitioned.errors).toEqual(['e1', 'e2']);
		});
	});

	/** Tests for nullable conversion and side-effect utilities: fromNullable, toNullable, tap, tapErr. */
	describe('utilities', () => {
		/** Validates that fromNullable() converts null to an err Result with the given error. */
		it('fromNullable() should convert null to error', () => {
			const result = fromNullable(null, 'was null');
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe('was null');
			}
		});

		/** Validates that fromNullable() converts undefined to an err Result. */
		it('fromNullable() should convert undefined to error', () => {
			const result = fromNullable(undefined, 'was undefined');
			expect(result.success).toBe(false);
		});

		/** Validates that fromNullable() wraps a non-null value in an ok Result. */
		it('fromNullable() should convert value to success', () => {
			const result = fromNullable(42, 'error');
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBe(42);
			}
		});

		/** Validates that toNullable() extracts the value from a success Result. */
		it('toNullable() should convert success to value', () => {
			const result = ok(42);
			expect(toNullable(result)).toBe(42);
		});

		/** Validates that toNullable() returns null for a failure Result. */
		it('toNullable() should convert error to null', () => {
			const result = err('error');
			expect(toNullable(result)).toBeNull();
		});

		/** Validates that tap() runs a side effect with the success value and returns the original Result. */
		it('tap() should execute side effect on success', () => {
			let sideEffect = 0;
			const result = ok(42);
			const tapped = tap(result, (v) => {
				sideEffect = v;
			});
			expect(sideEffect).toBe(42);
			expect(tapped).toBe(result);
		});

		/** Validates that tap() skips the side effect when the Result is err. */
		it('tap() should not execute on error', () => {
			let sideEffect = 0;
			const result: Result<number, string> = err('error');
			tap(result, (v) => {
				sideEffect = v;
			});
			expect(sideEffect).toBe(0);
		});

		/** Validates that tapErr() runs a side effect with the error value and returns the original Result. */
		it('tapErr() should execute side effect on error', () => {
			let sideEffect = '';
			const result: Result<number, string> = err('error');
			const tapped = tapErr(result, (e) => {
				sideEffect = e;
			});
			expect(sideEffect).toBe('error');
			expect(tapped).toBe(result);
		});

		/** Validates that tapErr() skips the side effect when the Result is ok. */
		it('tapErr() should not execute on success', () => {
			let sideEffect = '';
			const result: Result<number, string> = ok(42);
			tapErr(result, (e) => {
				sideEffect = e;
			});
			expect(sideEffect).toBe('');
		});
	});
});
