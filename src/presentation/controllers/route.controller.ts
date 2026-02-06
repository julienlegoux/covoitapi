import type { Context } from 'hono';
import type { CreateRouteInput, FindRouteInput } from '../../application/dtos/route.dto.js';
import { CreateRouteUseCase } from '../../application/use-cases/route/create-route.use-case.js';
import { DeleteRouteUseCase } from '../../application/use-cases/route/delete-route.use-case.js';
import { FindRouteUseCase } from '../../application/use-cases/route/find-route.use-case.js';
import { GetRouteUseCase } from '../../application/use-cases/route/get-route.use-case.js';
import { ListRoutesUseCase } from '../../application/use-cases/route/list-routes.use-case.js';
import { container } from '../../infrastructure/di/container.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createRouteSchema } from '../validators/route.validator.js';

export async function listRoutes(c: Context): Promise<Response> {
	const useCase = container.resolve(ListRoutesUseCase);
	const result = await useCase.execute();
	return resultToResponse(c, result);
}

export async function getRoute(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(GetRouteUseCase);
	const result = await useCase.execute(id);
	return resultToResponse(c, result);
}

export async function findRoute(c: Context): Promise<Response> {
	const input: FindRouteInput = {
		villeD: c.req.query('villeD'),
		villeA: c.req.query('villeA'),
		dateT: c.req.query('dateT'),
	};

	const useCase = container.resolve(FindRouteUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result);
}

export async function createRoute(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createRouteSchema.parse(body);

	const input: CreateRouteInput = {
		kms: validated.kms,
		idpers: validated.idpers,
		dateT: validated.dateT,
		villeD: validated.villeD,
		villeA: validated.villeA,
		seats: validated.seats,
		carId: validated.carId,
	};

	const useCase = container.resolve(CreateRouteUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}

export async function deleteRoute(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(DeleteRouteUseCase);
	const result = await useCase.execute(id);
	return resultToResponse(c, result);
}
