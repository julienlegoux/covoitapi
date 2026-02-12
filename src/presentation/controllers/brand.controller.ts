/**
 * @module BrandController
 * Handles CRUD operations for car brands (e.g. Toyota, Honda).
 * All endpoints require authentication. Listing requires DRIVER role;
 * creation and deletion require ADMIN role.
 */
import type { Context } from 'hono';
import { CreateBrandUseCase } from '../../application/use-cases/brand/create-brand.use-case.js';
import { DeleteBrandUseCase } from '../../application/use-cases/brand/delete-brand.use-case.js';
import { ListBrandsUseCase } from '../../application/use-cases/brand/list-brands.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { paginationSchema } from '../../lib/shared/utils/pagination.util.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createBrandSchema } from '../../application/schemas/brand.schema.js';
import { uuidSchema } from '../../application/schemas/common.schema.js';

/**
 * Lists all car brands with pagination.
 *
 * **GET /api/brands** -- Auth required, DRIVER+
 *
 * @param c - Hono request context with optional `page` and `limit` query params
 * @returns 200 with `{ success: true, data: { data: Brand[], meta: PaginationMeta } }`
 */
export async function listBrands(c: Context): Promise<Response> {
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListBrandsUseCase);
	const result = await useCase.execute(pagination);
	return resultToResponse(c, result);
}

/**
 * Creates a new car brand.
 *
 * **POST /api/brands** -- Auth required, ADMIN only
 *
 * @param c - Hono request context containing the JSON body
 * @returns 201 with `{ success: true, data: Brand }` on success.
 *          Throws ZodError on invalid input.
 *
 * Request body: `{ name: string }`
 */
export async function createBrand(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createBrandSchema.parse(body);

	const useCase = container.resolve(CreateBrandUseCase);
	const result = await useCase.execute(validated);
	return resultToResponse(c, result, 201);
}

/**
 * Deletes a car brand by its UUID.
 *
 * **DELETE /api/brands/:id** -- Auth required, ADMIN only
 *
 * @param c - Hono request context with `id` route parameter (UUID)
 * @returns 204 (no content) on success,
 *          or an error response (e.g. 404 BRAND_NOT_FOUND).
 */
export async function deleteBrand(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const useCase = container.resolve(DeleteBrandUseCase);
	const result = await useCase.execute(id);
	if (!result.success) {
		return resultToResponse(c, result);
	}
	return c.body(null, 204);
}
