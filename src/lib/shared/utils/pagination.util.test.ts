import { describe, it, expect } from 'vitest';
import { paginationSchema, buildPaginationMeta, toSkipTake } from './pagination.util.js';

describe('paginationSchema', () => {
	it('should use defaults when no params provided', () => {
		const result = paginationSchema.parse({});
		expect(result).toEqual({ page: 1, limit: 20 });
	});

	it('should accept valid page and limit', () => {
		const result = paginationSchema.parse({ page: 2, limit: 50 });
		expect(result).toEqual({ page: 2, limit: 50 });
	});

	it('should coerce string values', () => {
		const result = paginationSchema.parse({ page: '3', limit: '10' });
		expect(result).toEqual({ page: 3, limit: 10 });
	});

	it('should reject page less than 1', () => {
		expect(() => paginationSchema.parse({ page: 0 })).toThrow();
	});

	it('should reject limit greater than 100', () => {
		expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
	});
});

describe('buildPaginationMeta', () => {
	it('should calculate correct meta for first page', () => {
		const meta = buildPaginationMeta({ page: 1, limit: 20 }, 50);
		expect(meta).toEqual({ page: 1, limit: 20, total: 50, totalPages: 3 });
	});

	it('should calculate correct meta when total is exactly divisible', () => {
		const meta = buildPaginationMeta({ page: 2, limit: 10 }, 30);
		expect(meta).toEqual({ page: 2, limit: 10, total: 30, totalPages: 3 });
	});

	it('should return totalPages = 1 when total is less than limit', () => {
		const meta = buildPaginationMeta({ page: 1, limit: 20 }, 5);
		expect(meta).toEqual({ page: 1, limit: 20, total: 5, totalPages: 1 });
	});

	it('should return totalPages = 0 when total is 0', () => {
		const meta = buildPaginationMeta({ page: 1, limit: 20 }, 0);
		expect(meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
	});

	it('should ceil totalPages when not exactly divisible', () => {
		const meta = buildPaginationMeta({ page: 1, limit: 10 }, 25);
		expect(meta).toEqual({ page: 1, limit: 10, total: 25, totalPages: 3 });
	});

	it('should return totalPages = 1 when total equals limit', () => {
		const meta = buildPaginationMeta({ page: 1, limit: 20 }, 20);
		expect(meta).toEqual({ page: 1, limit: 20, total: 20, totalPages: 1 });
	});
});

describe('toSkipTake', () => {
	it('should return skip=0, take=20 for first page with default limit', () => {
		const result = toSkipTake({ page: 1, limit: 20 });
		expect(result).toEqual({ skip: 0, take: 20 });
	});

	it('should return correct skip for second page', () => {
		const result = toSkipTake({ page: 2, limit: 20 });
		expect(result).toEqual({ skip: 20, take: 20 });
	});

	it('should return correct skip for third page with limit 10', () => {
		const result = toSkipTake({ page: 3, limit: 10 });
		expect(result).toEqual({ skip: 20, take: 10 });
	});

	it('should return correct skip for large page numbers', () => {
		const result = toSkipTake({ page: 100, limit: 50 });
		expect(result).toEqual({ skip: 4950, take: 50 });
	});
});
