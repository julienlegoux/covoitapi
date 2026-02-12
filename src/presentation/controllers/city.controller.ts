/**
 * @module CityController
 * Handles CRUD operations for cities used as departure/arrival points in travels.
 * All endpoints require authentication. Listing and creation require USER role;
 * deletion requires ADMIN role.
 */
import type { Context } from 'hono';
import { CreateCityUseCase } from '../../application/use-cases/city/create-city.use-case.js';
import { DeleteCityUseCase } from '../../application/use-cases/city/delete-city.use-case.js';
import { ListCitiesUseCase } from '../../application/use-cases/city/list-cities.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { paginationSchema } from '../../lib/shared/utils/pagination.util.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createCitySchema } from '../../application/schemas/city.schema.js';
import { uuidSchema } from '../../application/schemas/common.schema.js';

/**
 * Lists all cities with pagination.
 *
 * **GET /api/cities** -- Auth required, USER+
 *
 * @param c - Hono request context with optional `page` and `limit` query params
 * @returns 200 with `{ success: true, data: { data: City[], meta: PaginationMeta } }`
 */
export async function listCities(c: Context): Promise<Response> {
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListCitiesUseCase);
	const result = await useCase.execute(pagination);
	return resultToResponse(c, result);
}

/**
 * Creates a new city.
 *
 * **POST /api/cities** -- Auth required, USER+
 *
 * @param c - Hono request context containing the JSON body
 * @returns 201 with `{ success: true, data: City }` on success.
 *          Throws ZodError on invalid input.
 *
 * Request body: `{ cityName: string, zipcode: string }`
 */
export async function createCity(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createCitySchema.parse(body);

	const useCase = container.resolve(CreateCityUseCase);
	const result = await useCase.execute(validated);
	return resultToResponse(c, result, 201);
}

/**
 * Deletes a city by its UUID.
 *
 * **DELETE /api/cities/:id** -- Auth required, ADMIN only
 *
 * @param c - Hono request context with `id` route parameter (UUID)
 * @returns 204 (no content) on success,
 *          or an error response (e.g. 404 CITY_NOT_FOUND).
 */
export async function deleteCity(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const useCase = container.resolve(DeleteCityUseCase);
	const result = await useCase.execute(id);
	if (!result.success) {
		return resultToResponse(c, result);
	}
	return c.body(null, 204);
}
