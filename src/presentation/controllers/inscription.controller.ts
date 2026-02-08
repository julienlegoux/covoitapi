import type { Context } from 'hono';
import type { CreateInscriptionInput } from '../../application/dtos/inscription.dto.js';
import { CreateInscriptionUseCase } from '../../application/use-cases/inscription/create-inscription.use-case.js';
import { DeleteInscriptionUseCase } from '../../application/use-cases/inscription/delete-inscription.use-case.js';
import { ListInscriptionsUseCase } from '../../application/use-cases/inscription/list-inscriptions.use-case.js';
import { ListRoutePassengersUseCase } from '../../application/use-cases/inscription/list-route-passengers.use-case.js';
import { ListUserInscriptionsUseCase } from '../../application/use-cases/inscription/list-user-inscriptions.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { paginationSchema } from '../../lib/shared/utils/pagination.util.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createInscriptionSchema } from '../validators/inscription.validator.js';

export async function listInscriptions(c: Context): Promise<Response> {
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListInscriptionsUseCase);
	const result = await useCase.execute(pagination);
	return resultToResponse(c, result);
}

export async function listUserInscriptions(c: Context): Promise<Response> {
	const userId = c.req.param('id');
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListUserInscriptionsUseCase);
	const result = await useCase.execute(userId, pagination);
	return resultToResponse(c, result);
}

export async function listRoutePassengers(c: Context): Promise<Response> {
	const routeId = c.req.param('id');
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListRoutePassengersUseCase);
	const result = await useCase.execute(routeId, pagination);
	return resultToResponse(c, result);
}

export async function createInscription(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createInscriptionSchema.parse(body);

	const input: CreateInscriptionInput = {
		userId: c.get('userId'),
		travelId: validated.travelId,
	};

	const useCase = container.resolve(CreateInscriptionUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}

export async function deleteInscription(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(DeleteInscriptionUseCase);
	const result = await useCase.execute(id);
	if (!result.success) {
		return resultToResponse(c, result);
	}
	return c.body(null, 204);
}
