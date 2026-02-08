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
import type { CreateTravelInput } from '../../dtos/travel.dto.js';

type CreateTravelError = DriverNotFoundError | CarNotFoundError | RepositoryError;

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

	async execute(input: CreateTravelInput): Promise<Result<TravelEntity, CreateTravelError>> {
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
