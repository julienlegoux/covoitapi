/**
 * @module CarController
 * Handles CRUD operations for cars (vehicles registered by drivers).
 * All endpoints require authentication and at least DRIVER role.
 * Supports full replacement (PUT) and partial updates (PATCH).
 * Mutation endpoints pass the authenticated userId for ownership verification.
 */
import type { Context } from 'hono';
import { CreateCarUseCase } from '../../application/use-cases/car/create-car.use-case.js';
import { DeleteCarUseCase } from '../../application/use-cases/car/delete-car.use-case.js';
import { ListCarsUseCase } from '../../application/use-cases/car/list-cars.use-case.js';
import { UpdateCarUseCase } from '../../application/use-cases/car/update-car.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { paginationSchema } from '../../lib/shared/utils/pagination.util.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createCarSchema, updateCarSchema, patchCarSchema } from '../../application/schemas/car.schema.js';
import { uuidSchema } from '../../application/schemas/common.schema.js';
import type { WithAuthContext } from '../../lib/shared/types/auth-context.js';
import type { CreateCarSchemaType } from '../../application/schemas/car.schema.js';

/**
 * Lists all cars with pagination.
 *
 * **GET /api/cars** -- Auth required, DRIVER+
 *
 * @param c - Hono request context with optional `page` and `limit` query params
 * @returns 200 with `{ success: true, data: { data: Car[], meta: PaginationMeta } }`
 */
export async function listCars(c: Context): Promise<Response> {
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListCarsUseCase);
	const result = await useCase.execute(pagination);
	return resultToResponse(c, result);
}

/**
 * Creates a new car owned by the authenticated driver.
 *
 * **POST /api/cars** -- Auth required, DRIVER+
 *
 * @param c - Hono request context containing the JSON body
 * @returns 201 with `{ success: true, data: Car }` on success.
 *          Throws ZodError on invalid input.
 *
 * Request body: `{ model: string, brandId: string, licensePlate: string }`
 */
export async function createCar(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createCarSchema.parse(body);

	const input: WithAuthContext<CreateCarSchemaType> = {
		...validated,
		userId: c.get('userId'),
	};

	const useCase = container.resolve(CreateCarUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}

/**
 * Fully updates a car (all fields required). Verifies ownership.
 *
 * **PUT /api/cars/:id** -- Auth required, DRIVER+
 *
 * @param c - Hono request context with `id` route parameter and JSON body
 * @returns 200 with `{ success: true, data: Car }` on success,
 *          or an error response (e.g. 404 CAR_NOT_FOUND, 403 FORBIDDEN).
 *
 * Request body: `{ model: string, brandId: string, licensePlate: string }`
 */
export async function updateCar(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const body = await c.req.json();
	const validated = updateCarSchema.parse(body);
	const useCase = container.resolve(UpdateCarUseCase);
	const result = await useCase.execute(id, validated, c.get('userId'));
	return resultToResponse(c, result);
}

/**
 * Partially updates a car (only provided fields are updated). Verifies ownership.
 *
 * **PATCH /api/cars/:id** -- Auth required, DRIVER+
 *
 * @param c - Hono request context with `id` route parameter and partial JSON body
 * @returns 200 with `{ success: true, data: Car }` on success,
 *          or an error response (e.g. 404 CAR_NOT_FOUND, 403 FORBIDDEN).
 *
 * Request body: partial `{ model?: string, brandId?: string, licensePlate?: string }`
 */
export async function patchCar(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const body = await c.req.json();
	const validated = patchCarSchema.parse(body);
	const useCase = container.resolve(UpdateCarUseCase);
	const result = await useCase.execute(id, validated, c.get('userId'));
	return resultToResponse(c, result);
}

/**
 * Deletes a car by its UUID. Verifies ownership.
 *
 * **DELETE /api/cars/:id** -- Auth required, DRIVER+
 *
 * @param c - Hono request context with `id` route parameter (UUID)
 * @returns 204 (no content) on success,
 *          or an error response (e.g. 404 CAR_NOT_FOUND, 403 FORBIDDEN).
 */
export async function deleteCar(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const useCase = container.resolve(DeleteCarUseCase);
	const result = await useCase.execute({ id, userId: c.get('userId') });
	if (!result.success) {
		return resultToResponse(c, result);
	}
	return c.body(null, 204);
}
