/**
 * @module PaginationUtilTests
 *
 * Test suite for pagination utilities: the Zod paginationSchema for input
 * validation and coercion, buildPaginationMeta() for computing response
 * metadata (total, totalPages), and toSkipTake() for converting page/limit
 * pairs into Prisma-compatible skip/take values.
 */
import { describe, it, expect } from 'vitest';
import { paginationSchema, buildPaginationMeta, toSkipTake } from './pagination.util.js';

/** Tests for the Zod paginationSchema that validates and coerces page/limit query parameters. */
describe('paginationSchema', () => {
	/** Validates that omitting page and limit falls back to defaults (page=1, limit=20). */
	it('should use defaults when no params provided', () => {
		const result = paginationSchema.parse({});
		expect(result).toEqual({ page: 1, limit: 20 });
	});

	/** Validates that explicitly providing valid page and limit values passes through unchanged. */
	it('should accept valid page and limit', () => {
		const result = paginationSchema.parse({ page: 2, limit: 50 });
		expect(result).toEqual({ page: 2, limit: 50 });
	});

	/** Validates that string values from query params are coerced to numbers. */
	it('should coerce string values', () => {
		const result = paginationSchema.parse({ page: '3', limit: '10' });
		expect(result).toEqual({ page: 3, limit: 10 });
	});

	/** Validates that a page number below 1 is rejected by the schema. */
	it('should reject page less than 1', () => {
		expect(() => paginationSchema.parse({ page: 0 })).toThrow();
	});

	/** Validates that a limit exceeding 100 is rejected by the schema. */
	it('should reject limit greater than 100', () => {
		expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
	});
});

/** Tests for buildPaginationMeta() which computes pagination response metadata from page, limit, and total count. */
describe('buildPaginationMeta', () => {
	/** Validates correct meta calculation for 50 total items on the first page with limit 20. */
	it('should calculate correct meta for first page', () => {
		const meta = buildPaginationMeta({ page: 1, limit: 20 }, 50);
		expect(meta).toEqual({ page: 1, limit: 20, total: 50, totalPages: 3 });
	});

	/** Validates that totalPages is exact when total is evenly divisible by limit. */
	it('should calculate correct meta when total is exactly divisible', () => {
		const meta = buildPaginationMeta({ page: 2, limit: 10 }, 30);
		expect(meta).toEqual({ page: 2, limit: 10, total: 30, totalPages: 3 });
	});

	/** Validates that totalPages is 1 when the total count fits within a single page. */
	it('should return totalPages = 1 when total is less than limit', () => {
		const meta = buildPaginationMeta({ page: 1, limit: 20 }, 5);
		expect(meta).toEqual({ page: 1, limit: 20, total: 5, totalPages: 1 });
	});

	/** Validates that totalPages is 0 when there are no items at all. */
	it('should return totalPages = 0 when total is 0', () => {
		const meta = buildPaginationMeta({ page: 1, limit: 20 }, 0);
		expect(meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
	});

	/** Validates that totalPages is rounded up (ceil) when total is not evenly divisible. */
	it('should ceil totalPages when not exactly divisible', () => {
		const meta = buildPaginationMeta({ page: 1, limit: 10 }, 25);
		expect(meta).toEqual({ page: 1, limit: 10, total: 25, totalPages: 3 });
	});

	/** Validates that totalPages is exactly 1 when total equals limit (boundary case). */
	it('should return totalPages = 1 when total equals limit', () => {
		const meta = buildPaginationMeta({ page: 1, limit: 20 }, 20);
		expect(meta).toEqual({ page: 1, limit: 20, total: 20, totalPages: 1 });
	});
});

/** Tests for toSkipTake() which converts page/limit to Prisma skip/take offset values. */
describe('toSkipTake', () => {
	/** Validates that page 1 produces skip=0 (no offset) with the given take. */
	it('should return skip=0, take=20 for first page with default limit', () => {
		const result = toSkipTake({ page: 1, limit: 20 });
		expect(result).toEqual({ skip: 0, take: 20 });
	});

	/** Validates that page 2 skips exactly one page's worth of items. */
	it('should return correct skip for second page', () => {
		const result = toSkipTake({ page: 2, limit: 20 });
		expect(result).toEqual({ skip: 20, take: 20 });
	});

	/** Validates correct skip calculation for page 3 with a custom limit of 10. */
	it('should return correct skip for third page with limit 10', () => {
		const result = toSkipTake({ page: 3, limit: 10 });
		expect(result).toEqual({ skip: 20, take: 10 });
	});

	/** Validates correct skip calculation for a very large page number (page 100, limit 50). */
	it('should return correct skip for large page numbers', () => {
		const result = toSkipTake({ page: 100, limit: 50 });
		expect(result).toEqual({ skip: 4950, take: 50 });
	});
});
