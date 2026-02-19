import type { Context } from 'hono';
import { container } from '../../../lib/shared/di/container.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { resultToResponse } from '../../../lib/shared/utils/result-response.util.js';
import { paginationSchema } from '../../../lib/shared/utils/pagination.util.js';
import { ListUsersUseCase } from '../../../application/use-cases/user/list-users.use-case.js';
import { GetUserUseCase } from '../../../application/use-cases/user/get-user.use-case.js';
import { UpdateUserUseCase } from '../../../application/use-cases/user/update-user.use-case.js';
import { AnonymizeUserUseCase } from '../../../application/use-cases/user/anonymize-user.use-case.js';
import { ListUserInscriptionsUseCase } from '../../../application/use-cases/inscription/list-user-inscriptions.use-case.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import type { TripRepository } from '../../../domain/repositories/trip.repository.js';
import { uuidSchema } from '../../../application/schemas/common.schema.js';
import { vpCreatePersonSchema, vpPatchPersonSchema } from '../schemas.js';
import { toVpPerson } from '../mappers.js';

export async function vpListPersons(c: Context): Promise<Response> {
	const useCase = container.resolve(ListUsersUseCase);
	const result = await useCase.execute();
	if (!result.success) return resultToResponse(c, result);
	return c.json({ success: true, data: result.value.map(toVpPerson) });
}

export async function vpGetPerson(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const requestingUserId = c.get('userId') as string;
	const role = c.get('role') as string;

	if (id !== requestingUserId && role !== 'ADMIN') {
		return c.json(
			{ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
			403,
		);
	}

	const useCase = container.resolve(GetUserUseCase);
	const result = await useCase.execute(id);
	if (!result.success) return resultToResponse(c, result);
	return c.json({ success: true, data: toVpPerson(result.value) });
}

export async function vpCreatePerson(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = vpCreatePersonSchema.parse(body);
	const userId = c.get('userId') as string;

	const useCase = container.resolve(UpdateUserUseCase);
	const result = await useCase.execute(userId, {
		firstName: validated.firstname,
		lastName: validated.lastname,
		phone: validated.phone,
	});
	if (!result.success) return resultToResponse(c, result);
	return c.json({ success: true, data: toVpPerson(result.value) }, 201);
}

export async function vpPatchPerson(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const requestingUserId = c.get('userId') as string;
	const role = c.get('role') as string;

	if (id !== requestingUserId && role !== 'ADMIN') {
		return c.json(
			{ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
			403,
		);
	}

	const body = await c.req.json();
	const validated = vpPatchPersonSchema.parse(body);

	if (validated.status?.toUpperCase() === 'DELETED') {
		const useCase = container.resolve(AnonymizeUserUseCase);
		const result = await useCase.execute(id);
		if (!result.success) return resultToResponse(c, result);
		return c.body(null, 204);
	}

	const useCase = container.resolve(UpdateUserUseCase);
	const result = await useCase.execute(id, {
		firstName: validated.firstname,
		lastName: validated.lastname,
		phone: validated.phone,
	});
	if (!result.success) return resultToResponse(c, result);
	return c.json({ success: true, data: toVpPerson(result.value) });
}

export async function vpDeletePerson(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const useCase = container.resolve(AnonymizeUserUseCase);
	const result = await useCase.execute(id);
	if (!result.success) return resultToResponse(c, result);
	return c.body(null, 204);
}

export async function vpGetPersonTripsDriver(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));

	const driverRepo = container.resolve<DriverRepository>(TOKENS.DriverRepository);
	const driverResult = await driverRepo.findByUserId(id);
	if (!driverResult.success) return resultToResponse(c, driverResult);
	if (!driverResult.value) {
		return c.json({ success: true, data: [] });
	}

	const driverRefId = driverResult.value.refId;
	const tripRepo = container.resolve<TripRepository>(TOKENS.TripRepository);
	const tripsResult = await tripRepo.findAll();
	if (!tripsResult.success) return resultToResponse(c, tripsResult);

	const driverTrips = tripsResult.value.data.filter(
		(trip) => trip.driverRefId === driverRefId,
	);

	return c.json({ success: true, data: driverTrips });
}

export async function vpGetPersonTripsPassenger(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListUserInscriptionsUseCase);
	const result = await useCase.execute(id, pagination);
	return resultToResponse(c, result);
}
