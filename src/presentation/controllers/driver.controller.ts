/**
 * @module DriverController
 * Handles driver registration. A user upgrades their role to DRIVER
 * by providing license information. Requires authentication with USER+ role.
 * The authenticated user's ID is injected from the request context.
 */
import type { Context } from 'hono';
import { createDriverSchema, type CreateDriverSchemaType } from '../../application/schemas/driver.schema.js';
import { CreateDriverUseCase } from '../../application/use-cases/driver/create-driver.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import type { WithAuthContext } from '../../lib/shared/types/auth-context.js';

/**
 * Registers the authenticated user as a driver.
 *
 * **POST /api/drivers** -- Auth required, USER+
 *
 * Reads `userId` from the Hono context (set by authMiddleware) and merges it
 * with the validated request body before delegating to the use case.
 *
 * @param c - Hono request context with JSON body and `userId` set on context
 * @returns 201 with `{ success: true, data: Driver }` on success.
 *          Throws ZodError on invalid input.
 *
 * Request body: `{ licenseNumber: string }`
 */
export async function createDriver(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createDriverSchema.parse(body);

	const input: WithAuthContext<CreateDriverSchemaType> = {
		...validated,
		userId: c.get('userId'),
	};

	const useCase = container.resolve(CreateDriverUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}
