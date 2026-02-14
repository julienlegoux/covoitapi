/**
 * @module prisma-trip.repository
 * Prisma-backed implementation of the {@link TripRepository} domain interface.
 * Manages carpooling trips, including paginated listing, filtered search,
 * creation with city associations, and deletion. All queries operate on the
 * `trips` database table via the renamed Prisma `Trip` model.
 */

import { inject, injectable } from 'tsyringe';
import type { CreateTripData, TripEntity } from '../../../domain/entities/trip.entity.js';
import type { TripRepository, TripFilters } from '../../../domain/repositories/trip.repository.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Prisma implementation of {@link TripRepository}.
 * Operates on the `trips` table (mapped from Prisma `Trip` model).
 * Injected via tsyringe with the PrismaClient token.
 */
@injectable()
export class PrismaTripRepository implements TripRepository {
    private readonly logger: Logger;

    constructor(
        @inject(TOKENS.PrismaClient)
        private readonly prisma: PrismaClient,
        @inject(TOKENS.Logger) logger: Logger,
    ) {
        this.logger = logger.child({ repository: 'TripRepository' });
    }

    /**
     * Retrieves all trips with optional pagination.
     * Includes related driver, car, cities, and inscription data.
     * Runs findMany and count in parallel for efficient pagination.
     * @param params - Optional pagination with `skip` and `take`.
     * @returns `ok({ data, total })` with paginated trips and total count,
     *          or `err(DatabaseError)` on failure.
     */
    async findAll(params?: { skip: number; take: number }): Promise<Result<{ data: TripEntity[]; total: number }, DatabaseError>> {
        try {
            const [trips, total] = await Promise.all([
                this.prisma.trip.findMany({
                    ...(params && { skip: params.skip, take: params.take }),
                    include: {
                        driver: true,
                        car: true,
                        cities: { include: { city: true } },
                        inscriptions: true,
                    },
                }),
                this.prisma.trip.count(),
            ]);
            return ok({ data: trips as unknown as TripEntity[], total });
        } catch (e) {
            this.logger.error('Failed to find all trips', e instanceof Error ? e : null, { operation: 'findAll' });
            return err(new DatabaseError('Failed to find all trips', e));
        }
    }

    /**
     * Finds a single trip by UUID with all related data.
     * @param id - The UUID of the trip.
     * @returns `ok(TripEntity)` if found, `ok(null)` if not found,
     *          or `err(DatabaseError)` on failure.
     */
    async findById(id: string): Promise<Result<TripEntity | null, DatabaseError>> {
        try {
            const trip = await this.prisma.trip.findUnique({
                where: { id },
                include: {
                    driver: true,
                    car: true,
                    cities: { include: { city: true } },
                    inscriptions: true,
                },
            });
            return ok(trip as unknown as TripEntity | null);
        } catch (e) {
            this.logger.error('Failed to find trip by ID', e instanceof Error ? e : null, { operation: 'findById', tripId: id });
            return err(new DatabaseError('Failed to find trip by id', e));
        }
    }

    /**
     * Searches trips matching optional departure city, arrival city, and date filters.
     * Uses Prisma `some` relation filters on the nested `cities` relation, checking
     * city name and CityTrip type (DEPARTURE/ARRIVAL).
     * @param filters - Optional search filters.
     * @returns `ok(TripEntity[])` with matching trips, or `err(DatabaseError)` on failure.
     */
    async findByFilters(filters: TripFilters): Promise<Result<TripEntity[], DatabaseError>> {
        try {
            const where: Record<string, unknown> = {};

            if (filters.departureCity) {
                where.cities = {
                    some: {
                        city: { cityName: { contains: filters.departureCity, mode: 'insensitive' } },
                        type: 'DEPARTURE',
                    },
                };
            }

            if (filters.arrivalCity) {
                const arrivalFilter = {
                    some: {
                        city: { cityName: { contains: filters.arrivalCity, mode: 'insensitive' } },
                        type: 'ARRIVAL',
                    },
                };
                // Merge with existing cities filter if departureCity was also specified
                if (where.cities) {
                    where.AND = [
                        { cities: where.cities },
                        { cities: arrivalFilter },
                    ];
                    delete where.cities;
                } else {
                    where.cities = arrivalFilter;
                }
            }

            if (filters.date) {
                // Match the full day: from start of day to start of next day
                const startOfDay = new Date(filters.date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(startOfDay);
                endOfDay.setDate(endOfDay.getDate() + 1);
                where.dateTrip = { gte: startOfDay, lt: endOfDay };
            }

            const trips = await this.prisma.trip.findMany({
                where,
                include: {
                    driver: true,
                    car: true,
                    cities: { include: { city: true } },
                    inscriptions: true,
                },
            });

            return ok(trips as unknown as TripEntity[]);
        } catch (e) {
            this.logger.error('Failed to find trips by filters', e instanceof Error ? e : null, { operation: 'findByFilters', filters });
            return err(new DatabaseError('Failed to find trips by filters', e));
        }
    }

    /**
     * Creates a new trip, optionally linking it to cities via CityTrip join records.
     * Uses a Prisma nested create to atomically persist the trip and its city associations.
     * @param data - Trip data including driver/car refIds and optional cityRefIds.
     * @returns `ok(TripEntity)` with the created trip, or `err(DatabaseError)` on failure.
     */
    async create(data: CreateTripData): Promise<Result<TripEntity, DatabaseError>> {
        try {
            const trip = await this.prisma.trip.create({
                data: {
                    dateTrip: data.dateTrip,
                    kms: data.kms,
                    seats: data.seats,
                    driverRefId: data.driverRefId,
                    carRefId: data.carRefId,
                    ...(data.cityRefIds && data.cityRefIds.length > 0 && {
                        cities: {
                            create: data.cityRefIds.map((cityRefId, index) => ({
                                cityRefId,
                                type: index === 0 ? 'DEPARTURE' : 'ARRIVAL',
                            })),
                        },
                    }),
                },
                include: {
                    driver: true,
                    car: true,
                    cities: { include: { city: true } },
                    inscriptions: true,
                },
            });
            return ok(trip as unknown as TripEntity);
        } catch (e) {
            this.logger.error('Failed to create trip', e instanceof Error ? e : null, { operation: 'create' });
            return err(new DatabaseError('Failed to create trip', e));
        }
    }

    /**
     * Deletes a trip by UUID.
     * @param id - The UUID of the trip to delete.
     * @returns `ok(undefined)` on success, or `err(DatabaseError)` on failure.
     */
    async delete(id: string): Promise<Result<void, DatabaseError>> {
        try {
            await this.prisma.trip.delete({
                where: { id },
            });
            return ok(undefined);
        } catch (e) {
            this.logger.error('Failed to delete trip', e instanceof Error ? e : null, { operation: 'delete', tripId: id });
            return err(new DatabaseError('Failed to delete trip', e));
        }
    }
}
