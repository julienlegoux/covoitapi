import type { Context } from 'hono';
import { container } from '../../../lib/shared/di/container.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { resultToResponse } from '../../../lib/shared/utils/result-response.util.js';
import { paginationSchema } from '../../../lib/shared/utils/pagination.util.js';
import { ListTripsUseCase } from '../../../application/use-cases/trip/list-trips.use-case.js';
import { GetTripUseCase } from '../../../application/use-cases/trip/get-trip.use-case.js';
import { FindTripUseCase } from '../../../application/use-cases/trip/find-trip.use-case.js';
import { CreateTripUseCase } from '../../../application/use-cases/trip/create-trip.use-case.js';
import { DeleteTripUseCase } from '../../../application/use-cases/trip/delete-trip.use-case.js';
import { CreateInscriptionUseCase } from '../../../application/use-cases/inscription/create-inscription.use-case.js';
import { ListTripPassengersUseCase } from '../../../application/use-cases/inscription/list-trip-passengers.use-case.js';
import type { WithAuthContext } from '../../../lib/shared/types/auth-context.js';
import type { CreateTripSchemaType } from '../../../application/schemas/trip.schema.js';
import type { CreateInscriptionSchemaType } from '../../../application/schemas/inscription.schema.js';
import { uuidSchema } from '../../../application/schemas/common.schema.js';
import { vpCreateTripSchema, vpPatchTripSchema, vpTripInscriptionSchema } from '../schemas.js';
import type { PrismaClient } from '../../../infrastructure/database/generated/prisma/client.js';

export async function vpListTrips(c: Context): Promise<Response> {
	const startingcity = c.req.query('startingcity');
	const arrivalcity = c.req.query('arrivalcity');
	const tripdate = c.req.query('tripdate');

	if (startingcity || arrivalcity || tripdate) {
		const useCase = container.resolve(FindTripUseCase);
		const result = await useCase.execute({
			departureCity: startingcity,
			arrivalCity: arrivalcity,
			date: tripdate,
		});
		return resultToResponse(c, result);
	}

	const useCase = container.resolve(ListTripsUseCase);
	const result = await useCase.execute();
	return resultToResponse(c, result);
}

export async function vpGetTrip(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const useCase = container.resolve(GetTripUseCase);
	const result = await useCase.execute(id);
	return resultToResponse(c, result);
}

export async function vpCreateTrip(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = vpCreateTripSchema.parse(body);

	const userId = c.get('userId') as string;

	if (validated.person_id !== userId) {
		return c.json(
			{ success: false, error: { code: 'FORBIDDEN', message: 'person_id does not match authenticated user' } },
			403,
		);
	}

	const input: WithAuthContext<CreateTripSchemaType> = {
		kms: validated.kms,
		date: validated.trip_datetime,
		departureCity: validated.starting_address.city_name,
		arrivalCity: validated.arrival_address.city_name,
		seats: validated.seats,
		carId: validated.car_id,
		userId,
	};

	const useCase = container.resolve(CreateTripUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}

export async function vpPatchTrip(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const body = await c.req.json();
	const validated = vpPatchTripSchema.parse(body);

	const data: Record<string, unknown> = {};
	if (validated.kms !== undefined) data.kms = validated.kms;
	if (validated.seats !== undefined) data.seats = validated.seats;
	if (validated.trip_datetime !== undefined) data.dateTrip = new Date(validated.trip_datetime);

	if (Object.keys(data).length === 0) {
		return c.json(
			{ success: false, error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } },
			400,
		);
	}

	const prisma = container.resolve<PrismaClient>(TOKENS.PrismaClient);
	try {
		const updated = await prisma.trip.update({
			where: { id },
			data,
		});
		return c.json({ success: true, data: updated });
	} catch (e: unknown) {
		if (e && typeof e === 'object' && 'code' in e && (e as Record<string, unknown>).code === 'P2025') {
			return c.json(
				{ success: false, error: { code: 'TRIP_NOT_FOUND', message: `Trip not found: ${id}` } },
				404,
			);
		}
		throw e;
	}
}

export async function vpDeleteTrip(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const useCase = container.resolve(DeleteTripUseCase);
	const result = await useCase.execute({ id, userId: c.get('userId') as string });
	if (!result.success) return resultToResponse(c, result);
	return c.body(null, 204);
}

export async function vpGetTripPassengers(c: Context): Promise<Response> {
	const tripId = uuidSchema.parse(c.req.param('id'));
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListTripPassengersUseCase);
	const result = await useCase.execute(tripId, pagination);
	return resultToResponse(c, result);
}

export async function vpCreateTripInscription(c: Context): Promise<Response> {
	const tripId = uuidSchema.parse(c.req.param('id'));
	const body = await c.req.json();
	const validated = vpTripInscriptionSchema.parse(body);

	const authenticatedUserId = c.get('userId') as string;
	const role = c.get('role') as string;

	if (validated.person_id !== authenticatedUserId && role !== 'ADMIN') {
		return c.json(
			{ success: false, error: { code: 'FORBIDDEN', message: 'person_id does not match authenticated user' } },
			403,
		);
	}

	const input: WithAuthContext<CreateInscriptionSchemaType> = {
		tripId,
		userId: validated.person_id,
	};

	const useCase = container.resolve(CreateInscriptionUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}
