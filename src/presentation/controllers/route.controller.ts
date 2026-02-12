/**
 * @module RouteController
 * Handles travel/route CRUD operations for the carpooling platform.
 * "Route" in this context refers to a travel (journey from city A to city B).
 * All endpoints require authentication. Listing, searching, and getting require
 * USER+ role; creation and deletion require DRIVER+ role.
 */
import type { Context } from 'hono';
import { CreateTravelUseCase } from '../../application/use-cases/travel/create-travel.use-case.js';
import { DeleteTravelUseCase } from '../../application/use-cases/travel/delete-travel.use-case.js';
import { FindTravelUseCase } from '../../application/use-cases/travel/find-travel.use-case.js';
import { GetTravelUseCase } from '../../application/use-cases/travel/get-travel.use-case.js';
import { ListTravelsUseCase } from '../../application/use-cases/travel/list-travels.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createTravelSchema, findTravelQuerySchema } from '../../application/schemas/travel.schema.js';
import type { CreateTravelSchemaType } from '../../application/schemas/travel.schema.js';
import type { WithAuthContext } from '../../lib/shared/types/auth-context.js';
import { uuidSchema } from '../../application/schemas/common.schema.js';

/**
 * Lists all available travel routes.
 *
 * **GET /api/travels** -- Auth required, USER+
 *
 * @param c - Hono request context
 * @returns 200 with `{ success: true, data: Travel[] }`
 */
export async function listRoutes(c: Context): Promise<Response> {
	const useCase = container.resolve(ListTravelsUseCase);
	const result = await useCase.execute();
	return resultToResponse(c, result);
}

/**
 * Gets a single travel route by its UUID.
 *
 * **GET /api/travels/:id** -- Auth required, USER+
 *
 * @param c - Hono request context with `id` route parameter (UUID)
 * @returns 200 with `{ success: true, data: Travel }` on success,
 *          or an error response (e.g. 404 TRAVEL_NOT_FOUND).
 */
export async function getRoute(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const useCase = container.resolve(GetTravelUseCase);
	const result = await useCase.execute(id);
	return resultToResponse(c, result);
}

/**
 * Searches for travel routes by departure city, arrival city, and/or date.
 *
 * **GET /api/travels/search** -- Auth required, USER+
 *
 * @param c - Hono request context with optional query params:
 *            `departureCity`, `arrivalCity`, `date` (ISO date string)
 * @returns 200 with `{ success: true, data: Travel[] }` matching the search criteria
 */
export async function findRoute(c: Context): Promise<Response> {
	const validated = findTravelQuerySchema.parse({
		departureCity: c.req.query('departureCity'),
		arrivalCity: c.req.query('arrivalCity'),
		date: c.req.query('date'),
	});

	const useCase = container.resolve(FindTravelUseCase);
	const result = await useCase.execute(validated);
	return resultToResponse(c, result);
}

/**
 * Creates a new travel route. The authenticated user is set as the driver.
 *
 * **POST /api/travels** -- Auth required, DRIVER+
 *
 * Reads `userId` from the Hono context (set by authMiddleware) and merges it
 * with the validated request body.
 *
 * @param c - Hono request context with JSON body and `userId` set on context
 * @returns 201 with `{ success: true, data: Travel }` on success.
 *          Throws ZodError on invalid input.
 *
 * Request body: `{ kms: number, date: string, departureCity: string, arrivalCity: string, seats: number, carId: string }`
 */
export async function createRoute(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createTravelSchema.parse(body);

	const input: WithAuthContext<CreateTravelSchemaType> = {
		...validated,
		userId: c.get('userId'),
	};

	const useCase = container.resolve(CreateTravelUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}

/**
 * Deletes a travel route by its UUID.
 *
 * **DELETE /api/travels/:id** -- Auth required, DRIVER+
 *
 * @param c - Hono request context with `id` route parameter (UUID)
 * @returns 204 (no content) on success,
 *          or an error response (e.g. 404 TRAVEL_NOT_FOUND).
 */
export async function deleteRoute(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const useCase = container.resolve(DeleteTravelUseCase);
	const result = await useCase.execute({ id, userId: c.get('userId') });
	if (!result.success) {
		return resultToResponse(c, result);
	}
	return c.body(null, 204);
}
