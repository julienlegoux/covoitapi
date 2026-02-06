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

describe('Result utilities', () => {
	describe('constructors', () => {
		it('ok() should create success result', () => {
			const result = ok(42);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBe(42);
			}
		});

		it('err() should create failure result', () => {
			const result = err('error message');
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe('error message');
			}
		});
	});

	describe('type guards', () => {
		it('isOk() should return true for success', () => {
			const result = ok(42);
			expect(isOk(result)).toBe(true);
		});

		it('isOk() should return false for failure', () => {
			const result = err('error');
			expect(isOk(result)).toBe(false);
		});

		it('isErr() should return true for failure', () => {
			const result = err('error');
			expect(isErr(result)).toBe(true);
		});

		it('isErr() should return false for success', () => {
			const result = ok(42);
			expect(isErr(result)).toBe(false);
		});
	});

	describe('transformers', () => {
		it('map() should transform success value', () => {
			const result = ok(5);
			const mapped = map(result, (x) => x * 2);
			expect(mapped.success).toBe(true);
			if (mapped.success) {
				expect(mapped.value).toBe(10);
			}
		});

		it('map() should pass through error', () => {
			const result: Result<number, string> = err('error');
			const mapped = map(result, (x) => x * 2);
			expect(mapped.success).toBe(false);
			if (!mapped.success) {
				expect(mapped.error).toBe('error');
			}
		});

		it('mapErr() should transform error', () => {
			const result: Result<number, string> = err('error');
			const mapped = mapErr(result, (e) => e.toUpperCase());
			expect(mapped.success).toBe(false);
			if (!mapped.success) {
				expect(mapped.error).toBe('ERROR');
			}
		});

		it('mapErr() should pass through success', () => {
			const result: Result<number, string> = ok(42);
			const mapped = mapErr(result, (e) => e.toUpperCase());
			expect(mapped.success).toBe(true);
			if (mapped.success) {
				expect(mapped.value).toBe(42);
			}
		});

		it('flatMap() should chain operations', () => {
			const result = ok(5);
			const chained = flatMap(result, (x) => ok(x * 2));
			expect(chained.success).toBe(true);
			if (chained.success) {
				expect(chained.value).toBe(10);
			}
		});

		it('flatMap() should short-circuit on error', () => {
			const result: Result<number, string> = err('first error');
			const chained = flatMap(result, (x) => ok(x * 2));
			expect(chained.success).toBe(false);
			if (!chained.success) {
				expect(chained.error).toBe('first error');
			}
		});

		it('fold() should apply success handler', () => {
			const result = ok(5);
			const folded = fold(
				result,
				(x) => `success: ${x}`,
				(e) => `error: ${e}`,
			);
			expect(folded).toBe('success: 5');
		});

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

	describe('async transformers', () => {
		it('mapAsync() should transform success value asynchronously', async () => {
			const result = ok(5);
			const mapped = await mapAsync(result, async (x) => x * 2);
			expect(mapped.success).toBe(true);
			if (mapped.success) {
				expect(mapped.value).toBe(10);
			}
		});

		it('flatMapAsync() should chain async operations', async () => {
			const result = ok(5);
			const chained = await flatMapAsync(result, async (x) => ok(x * 2));
			expect(chained.success).toBe(true);
			if (chained.success) {
				expect(chained.value).toBe(10);
			}
		});
	});

	describe('unwrappers', () => {
		it('unwrap() should return value on success', () => {
			const result = ok(42);
			expect(unwrap(result)).toBe(42);
		});

		it('unwrap() should throw on error', () => {
			const result = err(new Error('test error'));
			expect(() => unwrap(result)).toThrow('test error');
		});

		it('unwrapOr() should return value on success', () => {
			const result = ok(42);
			expect(unwrapOr(result, 0)).toBe(42);
		});

		it('unwrapOr() should return default on error', () => {
			const result: Result<number, string> = err('error');
			expect(unwrapOr(result, 0)).toBe(0);
		});

		it('unwrapOrElse() should compute from error', () => {
			const result: Result<number, string> = err('error');
			expect(unwrapOrElse(result, (e) => e.length)).toBe(5);
		});

		it('unwrapErr() should return error on failure', () => {
			const result = err('test error');
			expect(unwrapErr(result)).toBe('test error');
		});

		it('unwrapErr() should throw on success', () => {
			const result = ok(42);
			expect(() => unwrapErr(result)).toThrow('Called unwrapErr on an Ok value');
		});
	});

	describe('try-catch wrappers', () => {
		it('tryCatch() should catch sync exceptions', () => {
			const result = tryCatch(() => {
				throw new Error('sync error');
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toBe('sync error');
			}
		});

		it('tryCatch() should return ok for successful sync', () => {
			const result = tryCatch(() => 42);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBe(42);
			}
		});

		it('tryCatchAsync() should catch async exceptions', async () => {
			const result = await tryCatchAsync(async () => {
				throw new Error('async error');
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toBe('async error');
			}
		});

		it('tryCatchAsync() should return ok for successful async', async () => {
			const result = await tryCatchAsync(async () => 42);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBe(42);
			}
		});
	});

	describe('combinators', () => {
		it('combine() should combine array of results', () => {
			const results = [ok(1), ok(2), ok(3)];
			const combined = combine(results);
			expect(combined.success).toBe(true);
			if (combined.success) {
				expect(combined.value).toEqual([1, 2, 3]);
			}
		});

		it('combine() should short-circuit on first error', () => {
			const results: Result<number, string>[] = [ok(1), err('error'), ok(3)];
			const combined = combine(results);
			expect(combined.success).toBe(false);
			if (!combined.success) {
				expect(combined.error).toBe('error');
			}
		});

		it('collectErrors() should extract all errors', () => {
			const results: Result<number, string>[] = [ok(1), err('e1'), ok(2), err('e2')];
			const errors = collectErrors(results);
			expect(errors).toEqual(['e1', 'e2']);
		});

		it('collectValues() should extract all values', () => {
			const results: Result<number, string>[] = [ok(1), err('e1'), ok(2), err('e2')];
			const values = collectValues(results);
			expect(values).toEqual([1, 2]);
		});

		it('partition() should separate values and errors', () => {
			const results: Result<number, string>[] = [ok(1), err('e1'), ok(2), err('e2')];
			const partitioned = partition(results);
			expect(partitioned.values).toEqual([1, 2]);
			expect(partitioned.errors).toEqual(['e1', 'e2']);
		});
	});

	describe('utilities', () => {
		it('fromNullable() should convert null to error', () => {
			const result = fromNullable(null, 'was null');
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe('was null');
			}
		});

		it('fromNullable() should convert undefined to error', () => {
			const result = fromNullable(undefined, 'was undefined');
			expect(result.success).toBe(false);
		});

		it('fromNullable() should convert value to success', () => {
			const result = fromNullable(42, 'error');
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBe(42);
			}
		});

		it('toNullable() should convert success to value', () => {
			const result = ok(42);
			expect(toNullable(result)).toBe(42);
		});

		it('toNullable() should convert error to null', () => {
			const result = err('error');
			expect(toNullable(result)).toBeNull();
		});

		it('tap() should execute side effect on success', () => {
			let sideEffect = 0;
			const result = ok(42);
			const tapped = tap(result, (v) => {
				sideEffect = v;
			});
			expect(sideEffect).toBe(42);
			expect(tapped).toBe(result);
		});

		it('tap() should not execute on error', () => {
			let sideEffect = 0;
			const result: Result<number, string> = err('error');
			tap(result, (v) => {
				sideEffect = v;
			});
			expect(sideEffect).toBe(0);
		});

		it('tapErr() should execute side effect on error', () => {
			let sideEffect = '';
			const result: Result<number, string> = err('error');
			const tapped = tapErr(result, (e) => {
				sideEffect = e;
			});
			expect(sideEffect).toBe('error');
			expect(tapped).toBe(result);
		});

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
