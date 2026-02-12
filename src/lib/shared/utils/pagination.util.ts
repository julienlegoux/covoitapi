/**
 * @module pagination.util
 * Provides pagination utilities for paginated API endpoints.
 * Includes a Zod schema for validating pagination query parameters,
 * types for paginated responses, and helper functions to convert
 * page/limit into Prisma-compatible skip/take values.
 */

import { z } from 'zod';

/**
 * Zod schema for validating pagination query parameters.
 * Coerces string values to numbers (for query string compatibility).
 * - page: integer >= 1, defaults to 1
 * - limit: integer 1-100, defaults to 20
 */
export const paginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Validated pagination parameters (page and limit). */
export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Generic paginated response structure returned by list endpoints.
 *
 * @template T - The type of items in the data array.
 * @property data - The array of items for the current page.
 * @property meta - Pagination metadata (page, limit, total, totalPages).
 */
export type PaginatedResult<T> = {
	data: T[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};

/**
 * Builds pagination metadata from the params and total record count.
 *
 * @param params - The validated pagination parameters.
 * @param total - The total number of records matching the query.
 * @returns An object with page, limit, total, and computed totalPages.
 */
export function buildPaginationMeta(params: PaginationParams, total: number) {
	return {
		page: params.page,
		limit: params.limit,
		total,
		totalPages: Math.ceil(total / params.limit),
	};
}

/**
 * Converts page/limit pagination params to Prisma skip/take format.
 *
 * @param params - The validated pagination parameters.
 * @returns An object with skip (offset) and take (limit) for Prisma queries.
 *
 * @example
 * toSkipTake({ page: 3, limit: 20 }) // { skip: 40, take: 20 }
 */
export function toSkipTake(params: PaginationParams) {
	return {
		skip: (params.page - 1) * params.limit,
		take: params.limit,
	};
}
