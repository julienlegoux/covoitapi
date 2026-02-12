/**
 * @module prisma-travel.repository
 * Prisma-backed implementation of the {@link TravelRepository} domain interface.
 * Manages carpooling travel/route records with deep relation loading
 * (driver, car with model/brand, cities, inscriptions).
 * Supports pagination, filtering by city and date, and nested city creation.
 */

import { inject, injectable } from 'tsyringe';
import type { CreateTravelData, TravelEntity } from '../../../domain/entities/travel.entity.js';
import type { TravelFilters, TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Prisma implementation of {@link TravelRepository}.
 * Operates on the `travel` table and eagerly loads related entities
 * (driver -> user, car -> model -> brand, cities via join table, inscriptions).
 * Cast to `TravelEntity` via `as unknown as` due to Prisma's generated types
 * differing from the domain entity shape.
 * Injected via tsyringe with the PrismaClient token.
 */
@injectable()
export class PrismaTravelRepository implements TravelRepository {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'TravelRepository' });
	}

	/**
	 * Retrieves all travel records with optional pagination.
	 * Runs findMany and count in parallel via Promise.all for efficiency.
	 * @param params - Optional pagination with `skip` and `take`.
	 * @returns `ok({ data, total })` with paginated travels and total count,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: TravelEntity[]; total: number }, DatabaseError>> {
		try {
			// Parallel queries: paginated data + total count for pagination metadata
			const [routes, total] = await Promise.all([
				this.prisma.travel.findMany({
					...(params && { skip: params.skip, take: params.take }),
					// Deep include: driver->user, car->model->brand, cities via join table
					include: {
						driver: { include: { user: true } },
						car: { include: { model: { include: { brand: true } } } },
						cities: { include: { city: true } },
					},
				}),
				this.prisma.travel.count(),
			]);
			return ok({ data: routes as unknown as TravelEntity[], total });
		} catch (e) {
			this.logger.error('Failed to find all travels', e instanceof Error ? e : null, { operation: 'findAll' });
			return err(new DatabaseError('Failed to find all travels', e));
		}
	}

	/**
	 * Finds a single travel by UUID, including all related data and inscriptions.
	 * The detail view includes inscriptions with user info, unlike findAll.
	 * @param id - The UUID of the travel.
	 * @returns `ok(TravelEntity)` if found, `ok(null)` if not found,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findById(id: string): Promise<Result<TravelEntity | null, DatabaseError>> {
		try {
			const route = await this.prisma.travel.findUnique({
				where: { id },
				// Full include with inscriptions for the detail view
				include: {
					driver: { include: { user: true } },
					car: { include: { model: { include: { brand: true } } } },
					cities: { include: { city: true } },
					inscriptions: { include: { user: true } },
				},
			});
			return ok(route as unknown as TravelEntity | null);
		} catch (e) {
			this.logger.error('Failed to find travel by ID', e instanceof Error ? e : null, { operation: 'findById', travelId: id });
			return err(new DatabaseError('Failed to find travel by id', e));
		}
	}

	/**
	 * Searches for travels matching optional filters: departure city, arrival city, and date.
	 * City filters use nested `some` queries on the travel-city join table,
	 * matching by city type (DEPARTURE/ARRIVAL) and city name.
	 * Date filter matches any travel within the same UTC day.
	 * @param filters - Optional search criteria (departureCity, arrivalCity, date).
	 * @returns `ok(TravelEntity[])` matching the filters, or `err(DatabaseError)` on failure.
	 */
	async findByFilters(filters: TravelFilters): Promise<Result<TravelEntity[], DatabaseError>> {
		try {
			const where: Record<string, unknown> = {};

			// Build AND conditions for city filters on the join table
			const andConditions: Record<string, unknown>[] = [];

			if (filters.departureCity) {
				// Filter via the travel-city join table: type=DEPARTURE and matching city name
				andConditions.push({
					cities: {
						some: {
							type: 'DEPARTURE',
							city: { cityName: filters.departureCity },
						},
					},
				});
			}

			if (filters.arrivalCity) {
				// Filter via the travel-city join table: type=ARRIVAL and matching city name
				andConditions.push({
					cities: {
						some: {
							type: 'ARRIVAL',
							city: { cityName: filters.arrivalCity },
						},
					},
				});
			}

			if (andConditions.length > 0) {
				where.AND = andConditions;
			}

			if (filters.date) {
				// Date range filter: match any travel within the same UTC day
				const startOfDay = new Date(filters.date);
				startOfDay.setUTCHours(0, 0, 0, 0);
				const endOfDay = new Date(filters.date);
				endOfDay.setUTCHours(23, 59, 59, 999);
				where.dateRoute = {
					gte: startOfDay,
					lte: endOfDay,
				};
			}

			const routes = await this.prisma.travel.findMany({
				where,
				include: {
					driver: { include: { user: true } },
					car: { include: { model: { include: { brand: true } } } },
					cities: { include: { city: true } },
				},
			});
			return ok(routes as unknown as TravelEntity[]);
		} catch (e) {
			this.logger.error('Failed to find travels by filters', e instanceof Error ? e : null, { operation: 'findByFilters', filters });
			return err(new DatabaseError('Failed to find travels by filters', e));
		}
	}

	/**
	 * Creates a new travel record with optional nested city associations.
	 * Cities are linked via a join table using Prisma's nested `create` syntax.
	 * The first cityRefId is assigned type DEPARTURE, subsequent ones are ARRIVAL.
	 * @param data - Travel creation data including dateRoute, kms, seats,
	 *               driverRefId, carRefId, and optional cityRefIds array.
	 * @returns `ok(TravelEntity)` with the created travel,
	 *          or `err(DatabaseError)` on failure.
	 */
	async create(data: CreateTravelData): Promise<Result<TravelEntity, DatabaseError>> {
		try {
			const route = await this.prisma.travel.create({
				data: {
					dateRoute: data.dateRoute,
					kms: data.kms,
					seats: data.seats,
					driverRefId: data.driverRefId,
					carRefId: data.carRefId,
					// Nested create on the travel-city join table: index 0 = DEPARTURE, rest = ARRIVAL
					cities: data.cityRefIds?.length
						? {
								create: data.cityRefIds.map((cityRefId, index) => ({
									cityRefId,
									type: index === 0 ? 'DEPARTURE' as const : 'ARRIVAL' as const,
								})),
							}
						: undefined,
				},
			});
			return ok(route);
		} catch (e) {
			this.logger.error('Failed to create travel', e instanceof Error ? e : null, { operation: 'create', driverRefId: data.driverRefId, carRefId: data.carRefId });
			return err(new DatabaseError('Failed to create travel', e));
		}
	}

	/**
	 * Deletes a travel record by UUID. Cascading deletes on related join
	 * table entries are handled by Prisma's referential actions.
	 * @param id - The UUID of the travel to delete.
	 * @returns `ok(undefined)` on success, or `err(DatabaseError)` on failure.
	 */
	async delete(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.travel.delete({
				where: { id },
			});
			return ok(undefined);
		} catch (e) {
			this.logger.error('Failed to delete travel', e instanceof Error ? e : null, { operation: 'delete', travelId: id });
			return err(new DatabaseError('Failed to delete travel', e));
		}
	}
}
