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
import type { CityRepository } from '../../../domain/repositories/city.repository.js';
import type { EmailService } from '../../../domain/services/email.service.js';
import type { WithAuthContext } from '../../../lib/shared/types/auth-context.js';
import type { CreateTripSchemaType } from '../../../application/schemas/trip.schema.js';
import type { CreateInscriptionSchemaType } from '../../../application/schemas/inscription.schema.js';
import { uuidSchema } from '../../../application/schemas/common.schema.js';
import { vpCreateTripSchema, vpPatchTripSchema, vpTripInscriptionSchema } from '../schemas.js';
import type { PrismaClient } from '../../../infrastructure/database/generated/prisma/client.js';

async function findOrCreateCityRefId(cityName: string): Promise<number> {
	const cityRepo = container.resolve<CityRepository>(TOKENS.CityRepository);
	const findResult = await cityRepo.findByCityName(cityName);
	if (findResult.success && findResult.value) return findResult.value.refId;

	const createResult = await cityRepo.create({ cityName, zipcode: '' });
	if (!createResult.success) throw new Error(`Failed to create city: ${cityName}`);
	return createResult.value.refId;
}

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

	let carId = validated.car_id;

	// Auto-resolve car if not provided
	if (!carId) {
		const prisma = container.resolve<PrismaClient>(TOKENS.PrismaClient);
		const driver = await prisma.driver.findFirst({
			where: { user: { id: userId } },
		});
		if (!driver) {
			return c.json(
				{ success: false, error: { code: 'DRIVER_NOT_FOUND', message: 'You must have a driver record to create a trip' } },
				400,
			);
		}
		const car = await prisma.car.findFirst({
			where: { driverRefId: driver.refId },
		});
		if (!car) {
			return c.json(
				{ success: false, error: { code: 'CAR_NOT_FOUND', message: 'No car found for your driver record' } },
				400,
			);
		}
		carId = car.id;
	}

	const input: WithAuthContext<CreateTripSchemaType> = {
		kms: validated.kms,
		date: validated.trip_datetime,
		departureCity: validated.starting_address.city_name,
		arrivalCity: validated.arrival_address.city_name,
		seats: validated.available_seats,
		carId,
		userId,
	};

	const useCase = container.resolve(CreateTripUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}

function buildScalarUpdates(validated: { kms?: number; available_seats?: number; trip_datetime?: string }): Record<string, unknown> {
	const data: Record<string, unknown> = {};
	if (validated.kms !== undefined) data.kms = validated.kms;
	if (validated.available_seats !== undefined) data.seats = validated.available_seats;
	if (validated.trip_datetime !== undefined) data.dateTrip = new Date(validated.trip_datetime);
	return data;
}

async function replaceCityTrip(prisma: PrismaClient, tripRefId: number, cityName: string, type: 'DEPARTURE' | 'ARRIVAL'): Promise<void> {
	const cityRefId = await findOrCreateCityRefId(cityName);
	await prisma.cityTrip.deleteMany({ where: { tripRefId, type } });
	await prisma.cityTrip.create({ data: { tripRefId, cityRefId, type } });
}

function isPrismaNotFound(e: unknown): boolean {
	return e !== null && typeof e === 'object' && 'code' in e && (e as Record<string, unknown>).code === 'P2025';
}

export async function vpPatchTrip(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const body = await c.req.json();
	const validated = vpPatchTripSchema.parse(body);

	const data = buildScalarUpdates(validated);
	const hasScalarUpdates = Object.keys(data).length > 0;
	const hasAddressUpdates = validated.starting_address !== undefined || validated.arrival_address !== undefined;

	if (!hasScalarUpdates && !hasAddressUpdates) {
		return c.json(
			{ success: false, error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } },
			400,
		);
	}

	const prisma = container.resolve<PrismaClient>(TOKENS.PrismaClient);

	try {
		const trip = await prisma.trip.findUnique({ where: { id }, select: { refId: true } });
		if (!trip) {
			return c.json(
				{ success: false, error: { code: 'TRIP_NOT_FOUND', message: `Trip not found: ${id}` } },
				404,
			);
		}

		if (hasScalarUpdates) {
			await prisma.trip.update({ where: { id }, data });
		}
		if (validated.starting_address) {
			await replaceCityTrip(prisma, trip.refId, validated.starting_address.city_name, 'DEPARTURE');
		}
		if (validated.arrival_address) {
			await replaceCityTrip(prisma, trip.refId, validated.arrival_address.city_name, 'ARRIVAL');
		}

		const updated = await prisma.trip.findUnique({ where: { id } });
		return c.json({ success: true, data: updated });
	} catch (e: unknown) {
		if (isPrismaNotFound(e)) {
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
	const prisma = container.resolve<PrismaClient>(TOKENS.PrismaClient);

	// Notify passengers before deletion
	try {
		const trip = await prisma.trip.findUnique({
			where: { id },
			select: {
				refId: true,
				dateTrip: true,
				inscriptions: {
					where: { status: 'ACTIVE' },
					select: {
						user: {
							select: {
								firstName: true,
								auth: { select: { email: true } },
							},
						},
					},
				},
			},
		});

		if (trip && trip.inscriptions.length > 0) {
			const emailService = container.resolve<EmailService>(TOKENS.EmailService);
			const tripDate = trip.dateTrip.toLocaleDateString('fr-FR');

			await Promise.allSettled(
				trip.inscriptions.map((inscription) =>
					emailService.send({
						to: inscription.user.auth.email,
						subject: 'Trajet annulé',
						html: `<p>Bonjour ${inscription.user.firstName ?? ''},</p><p>Le trajet du ${tripDate} auquel vous étiez inscrit(e) a été annulé.</p>`,
					}),
				),
			);
		}
	} catch {
		// Don't block deletion if email notification fails
	}

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

	// Resolve integer person_id (refId) to UUID
	const prisma = container.resolve<PrismaClient>(TOKENS.PrismaClient);
	const user = await prisma.user.findUnique({
		where: { refId: validated.person_id },
		select: { id: true },
	});
	if (!user) {
		return c.json(
			{ success: false, error: { code: 'PERSON_NOT_FOUND', message: `Person not found with id: ${validated.person_id}` } },
			404,
		);
	}

	if (user.id !== authenticatedUserId && role !== 'ADMIN') {
		return c.json(
			{ success: false, error: { code: 'FORBIDDEN', message: 'person_id does not match authenticated user' } },
			403,
		);
	}

	const input: WithAuthContext<CreateInscriptionSchemaType> = {
		tripId,
		userId: user.id,
	};

	const useCase = container.resolve(CreateInscriptionUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}
