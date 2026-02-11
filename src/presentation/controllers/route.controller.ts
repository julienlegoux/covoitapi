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

export async function listRoutes(c: Context): Promise<Response> {
	const useCase = container.resolve(ListTravelsUseCase);
	const result = await useCase.execute();
	return resultToResponse(c, result);
}

export async function getRoute(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(GetTravelUseCase);
	const result = await useCase.execute(id);
	return resultToResponse(c, result);
}

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

export async function deleteRoute(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(DeleteTravelUseCase);
	const result = await useCase.execute(id);
	if (!result.success) {
		return resultToResponse(c, result);
	}
	return c.body(null, 204);
}
