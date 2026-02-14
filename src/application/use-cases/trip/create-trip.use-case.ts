/**
 * @module CreateTripUseCase
 *
 * Creates a new carpooling trip offered by a driver. A trip
 * connects two cities on a specific date with a given number of available
 * seats and is linked to a driver and their car. Cities are found or
 * auto-created by name.
 */

import { inject, injectable } from 'tsyringe';
import type { TripEntity } from '../../../domain/entities/trip.entity.js';
import { DriverNotFoundError, CarNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { CityRepository } from '../../../domain/repositories/city.repository.js';
import type { TripRepository } from '../../../domain/repositories/trip.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreateTripSchemaType } from '../../schemas/trip.schema.js';
import type { WithAuthContext } from '../../../lib/shared/types/auth-context.js';

/**
 * Union of all possible error types returned by the create trip use case.
 *
 * - {@link DriverNotFoundError} - The authenticated user has no driver profile
 * - {@link CarNotFoundError} - The referenced car UUID does not exist
 * - {@link RepositoryError} - Database-level failure during any step
 */
type CreateTripError = DriverNotFoundError | CarNotFoundError | RepositoryError;

/**
 * Creates a new carpooling trip offered by the authenticated driver.
 *
 * Business flow:
 * 1. Resolve the user UUID to find the associated driver profile
 * 2. Resolve the car UUID to its internal refId
 * 3. Find or create departure and arrival cities by name
 * 4. Persist the trip record with all resolved refIds
 *
 * Cities that do not yet exist are auto-created with an empty zipcode.
 *
 * @dependencies TripRepository, DriverRepository, CityRepository, CarRepository
 */
@injectable()
export class CreateTripUseCase {
    private readonly logger: Logger;

    constructor(
        @inject(TOKENS.TripRepository)
        private readonly tripRepository: TripRepository,
        @inject(TOKENS.DriverRepository)
        private readonly driverRepository: DriverRepository,
        @inject(TOKENS.CityRepository)
        private readonly cityRepository: CityRepository,
        @inject(TOKENS.CarRepository)
        private readonly carRepository: CarRepository,
        @inject(TOKENS.Logger) logger: Logger,
    ) {
        this.logger = logger.child({ useCase: 'CreateTripUseCase' });
    }

    /**
     * Creates a new trip for the authenticated driver.
     *
     * @param input - Validated payload containing date, kms, seats, carId,
     *                departureCity, arrivalCity, and the authenticated userId
     * @returns A Result containing the created TripEntity on success,
     *          or a CreateTripError on failure
     */
    async execute(input: WithAuthContext<CreateTripSchemaType>): Promise<Result<TripEntity, CreateTripError>> {
        // Resolve user UUID to driver via relation filter (single query)
        const driverResult = await this.driverRepository.findByUserId(input.userId);
        if (!driverResult.success) {
            return driverResult;
        }
        if (!driverResult.value) {
            this.logger.warn('Driver not found for trip creation', { userId: input.userId });
            return err(new DriverNotFoundError(input.userId));
        }

        // Resolve car UUID to refId
        const carResult = await this.carRepository.findById(input.carId);
        if (!carResult.success) {
            return carResult;
        }
        if (!carResult.value) {
            this.logger.warn('Car not found for trip creation', { carId: input.carId });
            return err(new CarNotFoundError(input.carId));
        }

        const departureCityRefIdResult = await this.findOrCreateCityRefId(input.departureCity);
        if (!departureCityRefIdResult.success) {
            return departureCityRefIdResult;
        }

        const arrivalCityRefIdResult = await this.findOrCreateCityRefId(input.arrivalCity);
        if (!arrivalCityRefIdResult.success) {
            return arrivalCityRefIdResult;
        }

        const result = await this.tripRepository.create({
            dateTrip: new Date(input.date),
            kms: input.kms,
            seats: input.seats,
            driverRefId: driverResult.value.refId,
            carRefId: carResult.value.refId,
            cityRefIds: [departureCityRefIdResult.value, arrivalCityRefIdResult.value],
        });

        if (result.success) {
            this.logger.info('Trip created', { tripId: result.value.id });
        }

        return result;
    }

    private async findOrCreateCityRefId(cityName: string): Promise<Result<number, RepositoryError>> {
        const findResult = await this.cityRepository.findByCityName(cityName);
        if (!findResult.success) {
            return findResult;
        }

        if (findResult.value) {
            return { success: true, value: findResult.value.refId };
        }

        const createResult = await this.cityRepository.create({ cityName, zipcode: '' });
        if (!createResult.success) {
            return createResult;
        }

        return { success: true, value: createResult.value.refId };
    }
}
