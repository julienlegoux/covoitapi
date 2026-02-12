/**
 * @module ColorController
 * Handles CRUD operations for car colors.
 * All endpoints require authentication and at least DRIVER role.
 */
import type { Context } from 'hono';
import { CreateColorUseCase } from '../../application/use-cases/color/create-color.use-case.js';
import { DeleteColorUseCase } from '../../application/use-cases/color/delete-color.use-case.js';
import { ListColorsUseCase } from '../../application/use-cases/color/list-colors.use-case.js';
import { UpdateColorUseCase } from '../../application/use-cases/color/update-color.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { paginationSchema } from '../../lib/shared/utils/pagination.util.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createColorSchema, updateColorSchema } from '../../application/schemas/color.schema.js';

/**
 * Lists all available car colors with pagination.
 *
 * **GET /api/colors** -- Auth required, DRIVER+
 *
 * @param c - Hono request context with optional `page` and `limit` query params
 * @returns 200 with `{ success: true, data: { data: Color[], meta: PaginationMeta } }`
 */
export async function listColors(c: Context): Promise<Response> {
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListColorsUseCase);
	const result = await useCase.execute(pagination);
	return resultToResponse(c, result);
}

/**
 * Creates a new car color.
 *
 * **POST /api/colors** -- Auth required, DRIVER+
 *
 * @param c - Hono request context containing the JSON body
 * @returns 201 with `{ success: true, data: Color }` on success,
 *          or an error response (e.g. 409 COLOR_ALREADY_EXISTS).
 *          Throws ZodError on invalid input.
 *
 * Request body: `{ name: string, hex: string }`
 */
export async function createColor(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createColorSchema.parse(body);

	const useCase = container.resolve(CreateColorUseCase);
	const result = await useCase.execute(validated);
	return resultToResponse(c, result, 201);
}

/**
 * Partially updates a car color (name and/or hex).
 *
 * **PATCH /api/colors/:id** -- Auth required, DRIVER+
 *
 * @param c - Hono request context with `id` route parameter and partial JSON body
 * @returns 200 with `{ success: true, data: Color }` on success,
 *          or an error response (e.g. 404 COLOR_NOT_FOUND).
 *
 * Request body: `{ name?: string, hex?: string }`
 */
export async function updateColor(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const body = await c.req.json();
	const validated = updateColorSchema.parse(body);

	const useCase = container.resolve(UpdateColorUseCase);
	const result = await useCase.execute({ id, ...validated });
	return resultToResponse(c, result);
}

/**
 * Deletes a car color by its UUID.
 *
 * **DELETE /api/colors/:id** -- Auth required, DRIVER+
 *
 * @param c - Hono request context with `id` route parameter (UUID)
 * @returns 204 (no content) on success,
 *          or an error response (e.g. 404 COLOR_NOT_FOUND).
 */
export async function deleteColor(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(DeleteColorUseCase);
	const result = await useCase.execute(id);
	if (!result.success) {
		return resultToResponse(c, result);
	}
	return c.body(null, 204);
}
