import { inject, injectable } from 'tsyringe';
import type { TravelEntity } from '../../../domain/entities/travel.entity.js';
import { DriverNotFoundError } from '../../../domain/errors/domain.errors.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import type { CityRepository } from '../../../domain/repositories/city.repository.js';
import type { TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreateTravelInput } from '../../dtos/travel.dto.js';

type CreateTravelError = DriverNotFoundError | RepositoryError;

@injectable()
export class CreateTravelUseCase {
	constructor(
		@inject(TOKENS.TravelRepository)
		private readonly travelRepository: TravelRepository,
		@inject(TOKENS.DriverRepository)
		private readonly driverRepository: DriverRepository,
		@inject(TOKENS.CityRepository)
		private readonly cityRepository: CityRepository,
	) {}

	async execute(input: CreateTravelInput): Promise<Result<TravelEntity, CreateTravelError>> {
		const driverResult = await this.driverRepository.findByUserId(input.userId);
		if (!driverResult.success) {
			return driverResult;
		}

		if (!driverResult.value) {
			return err(new DriverNotFoundError(input.userId));
		}

		const departureCityIdResult = await this.findOrCreateCity(input.departureCity);
		if (!departureCityIdResult.success) {
			return departureCityIdResult;
		}

		const arrivalCityIdResult = await this.findOrCreateCity(input.arrivalCity);
		if (!arrivalCityIdResult.success) {
			return arrivalCityIdResult;
		}

		return this.travelRepository.create({
			dateRoute: new Date(input.date),
			kms: input.kms,
			seats: input.seats,
			driverId: driverResult.value.id,
			carId: input.carId,
			cityIds: [departureCityIdResult.value, arrivalCityIdResult.value],
		});
	}

	private async findOrCreateCity(cityName: string): Promise<Result<string, RepositoryError>> {
		const findResult = await this.cityRepository.findByCityName(cityName);
		if (!findResult.success) {
			return findResult;
		}

		if (findResult.value) {
			return { success: true, value: findResult.value.id };
		}

		const createResult = await this.cityRepository.create({ cityName, zipcode: '' });
		if (!createResult.success) {
			return createResult;
		}

		return { success: true, value: createResult.value.id };
	}
}
