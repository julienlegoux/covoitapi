/**
 * @module CreateTravelUseCase
 *
 * Creates a new carpooling travel (route) offered by a driver. A travel
 * connects two cities on a specific date with a given number of available
 * seats and is linked to a driver and their car. Cities are found or
 * auto-created by name.
 */

import { inject, injectable } from 'tsyringe';
import type { TravelEntity } from '../../../domain/entities/travel.entity.js';
import { DriverNotFoundError, CarNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { CityRepository } from '../../../domain/repositories/city.repository.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreateTravelSchemaType } from '../../schemas/travel.schema.js';
import type { WithAuthContext } from '../../../lib/shared/types/auth-context.js';

/**
 * Union of all possible error types returned by the create travel use case.
 *
 * - {@link DriverNotFoundError} - The authenticated user has no driver profile
 * - {@link CarNotFoundError} - The referenced car UUID does not exist
 * - {@link RepositoryError} - Database-level failure during any step
 */
type CreateTravelError = DriverNotFoundError | CarNotFoundError | RepositoryError;

/**
 * Creates a new carpooling travel offered by the authenticated driver.
 *
 * Business flow:
 * 1. Resolve the user UUID to find the associated driver profile
 * 2. Resolve the car UUID to its internal refId
 * 3. Find or create departure and arrival cities by name
 * 4. Persist the travel record with all resolved refIds
 *
 * Cities that do not yet exist are auto-created with an empty zipcode.
 *
 * @dependencies TravelRepository, DriverRepository, CityRepository, UserRepository, CarRepository
 */
@injectable()
export class CreateTravelUseCase {
	constructor(
		@inject(TOKENS.TravelRepository)
		private readonly travelRepository: TravelRepository,
		@inject(TOKENS.DriverRepository)
		private readonly driverRepository: DriverRepository,
		@inject(TOKENS.CityRepository)
		private readonly cityRepository: CityRepository,
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.CarRepository)
		private readonly carRepository: CarRepository,
	) {}

	/**
	 * Creates a new travel for the authenticated driver.
	 *
	 * @param input - Validated payload containing date, kms, seats, carId,
	 *                departureCity, arrivalCity, and the authenticated userId
	 * @returns A Result containing the created TravelEntity on success,
	 *          or a CreateTravelError on failure
	 */
	async execute(input: WithAuthContext<CreateTravelSchemaType>): Promise<Result<TravelEntity, CreateTravelError>> {
		// Resolve user UUID to get driver
		const userResult = await this.userRepository.findById(input.userId);
		if (!userResult.success) {
			return userResult;
		}
		if (!userResult.value) {
			return err(new DriverNotFoundError(input.userId));
		}

		const driverResult = await this.driverRepository.findByUserRefId(userResult.value.refId);
		if (!driverResult.success) {
			return driverResult;
		}
		if (!driverResult.value) {
			return err(new DriverNotFoundError(input.userId));
		}

		// Resolve car UUID to refId
		const carResult = await this.carRepository.findById(input.carId);
		if (!carResult.success) {
			return carResult;
		}
		if (!carResult.value) {
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

		return this.travelRepository.create({
			dateRoute: new Date(input.date),
			kms: input.kms,
			seats: input.seats,
			driverRefId: driverResult.value.refId,
			carRefId: carResult.value.refId,
			cityRefIds: [departureCityRefIdResult.value, arrivalCityRefIdResult.value],
		});
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
